const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });

function equals(text: string, term: string) {
  return collator.compare(text, term) === 0;
}

export function equalsTerm(text: string, term: string) {
  return equals(text.normalize('NFC'), term.normalize('NFC'));
}

export function startsWithTerm(text: string, term: string) {
  const target = text.normalize('NFC');
  const search = term.normalize('NFC');

  return equals(target.slice(0, search.length), search);
}

export function endsWithTerm(text: string, term: string) {
  const target = text.normalize('NFC');
  const search = term.normalize('NFC');

  return equals(target.slice(Math.max(target.length - search.length, 0)), search);
}

export function containsTerm(text: string, term: string) {
  const target = text.normalize('NFC');
  const search = term.normalize('NFC');

  if (!search) {
    return true;
  }

  for (let start = 0; start + search.length <= target.length; start += 1) {
    if (equals(target.slice(start, start + search.length), search)) {
      return true;
    }
  }

  return false;
}
