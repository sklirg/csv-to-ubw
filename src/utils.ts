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
