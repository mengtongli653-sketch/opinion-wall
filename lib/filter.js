import {
  listBlockedWords,
  addBlockedWord as dbAddWord,
  removeBlockedWord as dbRemoveWord,
} from './db';

export function getBlockedWords() {
  return listBlockedWords();
}

export function addBlockedWord(word) {
  return dbAddWord(word);
}

export function removeBlockedWord(id) {
  dbRemoveWord(id);
}

export function containsBlockedWord(text) {
  const words = listBlockedWords();
  const lower = String(text || '').toLowerCase();
  for (const { word } of words) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return null;
}
