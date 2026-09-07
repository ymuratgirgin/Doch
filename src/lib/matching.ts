// Shared between ExamTaker (rendering the ad/headline board during the
// exam) and the results/mistakes review pages (resolving a stored letter
// answer back to readable text). A matching option is generated as
// "a) Headline\nDetails\nTel. ..." — split off the letter prefix.

export function parseMatchingOption(opt: string): { letter: string; body: string } {
  const match = opt.match(/^([a-zA-Z]|x)\)\s*/);
  if (!match) return { letter: opt.trim(), body: opt };
  return { letter: match[1].toLowerCase(), body: opt.slice(match[0].length) };
}

// Resolves a bare letter answer (e.g. "a") back to its option's first line
// (the headline) for display in review contexts, given the question's raw
// options JSON. Falls back to the raw value if it isn't a matching answer.
export function resolveMatchingAnswer(value: string, optionsJson: string | null): string {
  if (!optionsJson) return value;
  let options: string[];
  try {
    options = JSON.parse(optionsJson) as string[];
  } catch {
    return value;
  }
  const match = options
    .map(parseMatchingOption)
    .find((o) => o.letter === value.trim().toLowerCase());
  if (!match) return value;
  const headline = match.body.split("\n")[0].trim();
  return `${match.letter}) ${headline}`;
}
