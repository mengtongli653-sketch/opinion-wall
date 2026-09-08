import {
  listBlockedWords,
  addBlockedWord as dbAddWord,
  removeBlockedWord as dbRemoveWord,
} from './db';

export async function getBlockedWords() {
  return listBlockedWords();
}

export async function addBlockedWord(word) {
  return dbAddWord(word);
}

export async function removeBlockedWord(id) {
  return dbRemoveWord(id);
}

export async function containsBlockedWord(text) {
  const words = await listBlockedWords();
  const lower = String(text || '').toLowerCase();
  for (const { word } of words) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return null;
}
