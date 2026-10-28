# SnapShare Scaling Plan

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from people they follow.

## Assumptions

- 10 million registered users.
- 10% of users are active each day.
- Each active user uploads 1 photo per day.
- Each active user views 50 feed pages per day.
- An average photo is 2 MB, and each photo also gets a 50 KB thumbnail.
- Peak traffic is 5 times the average.
- One day has 86,400 seconds.
- One feed page view means one request for a page of the feed.

**Daily active users (DAU):** 10,000,000 x 10% = **1,000,000 users per day**.

## Estimates

### Uploads per second
- Uploads per day: 1,000,000 users x 1 photo = 1,000,000 photos.
- Average: 1,000,000 / 86,400 = about **11.6 uploads per second**.
- Peak (5x): about **58 uploads per second**.

### Feed views per second
- Feed views per day: 1,000,000 users x 50 = 50,000,000 views.
- Average: 50,000,000 / 86,400 = about **579 views per second**.
- Peak (5x): about **2,900 views per second**.

### Photo storage per year
- Original photos per day: 1,000,000 x 2 MB = 2 TB.
- Thumbnails per day: 1,000,000 x 50 KB = 50 GB (0.05 TB).
- Originals per year: 2 TB x 365 = **730 TB**.
- Thumbnails per year: 0.05 TB x 365 = **18.25 TB**.
- Total per year: about **748 TB**, which is roughly 0.75 PB.

## Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 50 million feed views for every 1 million uploads, a ratio of about **50 reads to 1 write**.

What this means for the design:
- Make reads cheap and fast. Serve photos from a CDN and keep hot feed data in a cache.
- Add a read replica so most database reads do not touch the main database.
- Keep writes simple and safe. A single primary database can handle about 58 writes per second at peak, so the main work is storing the files and the thumbnail jobs.

## Why photos should not be stored in the database

- A 2 MB photo is a large binary file. Millions of them would make the database huge, slow to back up and expensive to replicate.
- Databases are built for small, structured rows that can be queried and indexed, not for serving big files.
- Every photo read would use database connections and bandwidth that the feed queries need.

Photos go in **object storage**, such as Amazon S3. It is cheap, scales to petabytes, and works with a CDN. The database keeps only a small row with the photo's id, the owner, the caption, the time, and the file's storage key or URL.

## Architecture diagram

```
                         +-----------+
                         |   Users   |
                         | (app/web) |
                         +-----+-----+
                               |
              photos and thumbnails       API requests
              (reads)                     (feed, upload)
                    |                           |
             +------v------+            +-------v--------+
             |     CDN     |            | Load balancer  |
             +------+------+            +-------+--------+
                    | cache miss                |
                    |                  +--------+--------+
                    |                  |                 |
                    |           +------v-----+    +------v-----+
                    |           | App server |    | App server |
                    |           +--+---+---+-+    +-+---+---+--+
                    |              |   |   |        |   |   |
                    |              |   |   +---+----+   |   |
                    |       feed   |   |       |        |   | upload
                    |       reads  |   |       |        |   | enqueue
                    |        +-----v---v-+     |        |   |
                    |        |   Cache   |     |        |   |
                    |        |  (Redis)  |     |        |   |
                    |        +-----+-----+     |        |   |
                    |              | miss      |        |   |
                    |        +-----v---------+ |   +----v---v-----+
                    |        |   Database    | |   |    Queue     |
                    |        |   (primary)   | |   +------+-------+
                    |        +-----+---------+ |          |
                    |              | replicates|          |
                    |        +-----v---------+ |   +------v-------+
                    |        |  Read replica |<+   | Thumbnail    |
                    |        +---------------+     | worker       |
                    |                              +------+-------+
                    |                                     |
              +-----v-------------------------------------v--+
              |        Object storage (originals +           |
              |        thumbnails)                           |
              +----------------------------------------------+
```

How to read it: app servers save the photo file in object storage and the photo's details in the database. Reads of the feed go to the cache first, then the read replica. The queue and worker create thumbnails and save them back to object storage. The CDN sits in front of object storage and serves photos and thumbnails to users.

## What each component does

- **CDN:** it keeps copies of photos and thumbnails close to users, so images load fast and the servers do not carry that traffic.
- **Load balancer:** it spreads incoming requests across several app servers so no single server is overloaded and one failure does not stop the app.
- **App servers:** they run the application logic for logging in, uploading, and building the feed, and they can be added when traffic grows.
- **Cache:** it holds frequently read data, such as feed pages and user profiles, in memory so most requests skip the database.
- **Database with a read replica:** the primary stores accounts, follows and photo records, and the replica takes the heavy read traffic off the primary.
- **Object storage:** it stores the photo files cheaply and reliably at petabyte scale, which a database cannot do well.
- **Queue:** it holds thumbnail jobs so uploads return quickly and no job is lost if the workers are busy.
- **Thumbnail worker:** it picks up jobs from the queue, creates the 50 KB thumbnail, and saves it, so users never wait for image processing.

## Upload flow, step by step

1. The user picks a photo in the app and taps upload.
2. The request reaches the **load balancer**, which sends it to one of the **app servers**.
3. The app server checks the user is logged in and that the file is a valid image within the size limit.
4. The app server saves the original photo in **object storage** and gets back a storage key.
5. The app server writes a row to the **database** (photo id, owner, caption, time, storage key, and a thumbnail status of "pending").
6. The app server puts a "create thumbnail" job on the **queue**, containing the photo id and storage key.
7. The app server replies to the user straight away with "upload successful". The user does not wait for the thumbnail.
8. A **thumbnail worker** takes the job from the queue, downloads the original, and creates a 50 KB thumbnail.
9. The worker saves the thumbnail in **object storage** and updates the database row to "ready". If it fails, the job is retried.
10. The app server removes the affected entries from the **cache** so followers see the new photo. The **CDN** then serves the thumbnail when followers open their feed.

## Trade-offs

1. **Cache speed against fresh data.** The cache makes feeds very fast, but cached pages can be a few seconds old, so a new photo may not show up in a follower's feed immediately. Shorter cache times give fresher feeds but send more traffic to the database.
2. **Read replica speed against consistency.** The replica takes load off the primary, but it copies data with a small delay. A user may upload a photo and not see it in their own feed for a moment. Reading the user's own recent posts from the primary reduces this, at the cost of extra load on the primary.
3. **Queue and worker speed against instant thumbnails.** Uploads feel fast because thumbnails are made in the background, but a thumbnail may not exist for the first few seconds. The app must show a placeholder or the original until it is ready, and we must run and monitor the queue and workers.
4. **CDN cost against performance.** A CDN makes photos load faster worldwide but adds a monthly cost, and deleted photos can linger in the CDN until their cache expires.
