/**
 * String manipulation helpers
 */

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str, maxLength = 20) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

function slugify(text) {
  if (!text) return '';
  // BUG: Replaces spaces with underscores instead of hyphens and fails to lowercase
  return text
    .trim()
    .replace(/\s+/g, '_'); // <--- BUG: Should be .toLowerCase().replace(/\s+/g, '-')
}

module.exports = {
  capitalize,
  truncate,
  slugify
};
