export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const filereader = new FileReader();
    filereader.readAsText(file);
    filereader.onload = () => {
      if (filereader.result !== null) {
        console.log("typeof result", typeof filereader.result);
        return resolve(filereader.result.toString());
      }
      return reject(new Error("Failed to read file contents"));
    };
  });
}

// Iterate through every character in the string and maybe apply character escapes
export function escapeQuerySelectorString(querySelector: string) {
  return [...querySelector]
    .map(maybeReplaceCharacterWithEscapedCharacter)
    .join("");
}

function maybeReplaceCharacterWithEscapedCharacter(char: string): string {
  const replaces = [["&", "&amp;"]];
  const replaceChars = replaces.map(x => x[0]);

  const indexOfReplacement = replaceChars.indexOf(char);

  return indexOfReplacement === -1
    ? char
    : char.replace(
        replaceChars[indexOfReplacement][0],
        replaceChars[indexOfReplacement][1]
      );
}
