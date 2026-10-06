// Day 3: Notes Toolkit

let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

const VALID_CATEGORIES = ["personal", "work", "study"];

// Returns every note whose text contains the word, ignoring upper and lower case.
function searchNotes(word) {
  const search = String(word).toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(search));
}

// Returns the note with the most characters, or null if there are no notes.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }
  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

// Returns an object that counts the notes in each category.
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category] += 1;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

// Returns a sentence such as "5 notes: 2 personal, 1 work, 2 study."
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  if (total === 0) {
    return `0 ${noteWord}.`;
  }

  const parts = [];
  for (const category of VALID_CATEGORIES) {
    if (counts[category]) {
      parts.push(`${counts[category]} ${category}`);
    }
  }
  return `${total} ${noteWord}: ${parts.join(", ")}.`;
}

// Returns true if a note with the same text exists, ignoring case and extra spaces.
function isDuplicate(text) {
  if (typeof text !== "string") {
    return false;
  }
  const cleaned = text.trim().toLowerCase().replace(/\s+/g, " ");
  return notes.some(
    (note) => note.text.trim().toLowerCase().replace(/\s+/g, " ") === cleaned
  );
}

// Adds a note if it passes every check. Returns true when added, false otherwise.
function addNote(text, category) {
  if (typeof text !== "string") {
    console.log("Not added: the text must be a string.");
    return false;
  }

  const cleaned = text.trim();

  if (cleaned.length < 1 || cleaned.length > 200) {
    console.log("Not added: the text must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(cleaned)) {
    console.log("Not added: a note with the same text already exists.");
    return false;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    console.log("Not added: the category must be personal, work or study.");
    return false;
  }

  const nextId = notes.length > 0 ? Math.max(...notes.map((note) => note.id)) + 1 : 1;
  notes.push({ id: nextId, text: cleaned, category: category });
  return true;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// searchNotes
console.log(searchNotes("milk"));
// Expected: [ { id: 1, text: "Buy milk and bread", category: "personal" } ]
console.log(searchNotes("MILK"));
// Expected: same result as above (case is ignored)
console.log(searchNotes("zebra"));
// Expected: [] (no matches)

// longestNote
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }
const savedNotes = notes;
notes = [];
console.log(longestNote());
// Expected: null (no notes)
notes = savedNotes;

// countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }
notes = [];
console.log(countByCategory());
// Expected: {} (no notes)
notes = savedNotes;

// getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."
notes = [savedNotes[0]];
console.log(getSummary());
// Expected: "1 note: 1 personal."
notes = [];
console.log(getSummary());
// Expected: "0 notes."
notes = savedNotes;

// isDuplicate
console.log(isDuplicate("  CALL   mum  "));
// Expected: true (case and extra spaces are ignored)
console.log(isDuplicate("Walk the dog"));
// Expected: false (no such note)

// addNote
console.log(addNote("Read chapter 4", "study"));
// Expected: true (note added with id 6)
console.log(addNote("  read CHAPTER 4  ", "study"));
// Expected: logs "Not added: a note with the same text already exists." then false
console.log(addNote("   ", "work"));
// Expected: logs "Not added: the text must be between 1 and 200 characters." then false
console.log(addNote("a".repeat(201), "work"));
// Expected: logs "Not added: the text must be between 1 and 200 characters." then false
console.log(addNote("Go for a run", "hobby"));
// Expected: logs "Not added: the category must be personal, work or study." then false
console.log(getSummary());
// Expected: "6 notes: 2 personal, 1 work, 3 study."
