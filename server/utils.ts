import { spawn } from "child_process";

function parseTable(data: string): { ProcessId: number; ExecutablePath: string }[] {
  // Remove carriage returns so it's easier to split lines
  data = data.replace(/\r/g, "");

  // Split the data into lines, remove the first 5 lines (header) and any empty lines or lines that don't provide the path
  const lines = data.split("\n").slice(5).map((line) => line.trim()).filter((line) => line.trim() !== "").filter((line) => line.includes(' '));

  return lines.map((line) => {
    const [ProcessId, ...ExecutablePathParts] = line.split(" ");
    const ExecutablePath = ExecutablePathParts.join(" "); // Paths can have spaces, so we need to join them back together
    return { ProcessId: parseInt(ProcessId, 10), ExecutablePath };
  });
}

// Some of the code stolen from https://github.com/yibn2008/find-process/blob/master/lib/find_process.js
export const findExecutables = async (pids: number[]): Promise<{ pid: number; bin: string }[]> => {
  return new Promise((resolve, reject) => {
    const cmd = "Get-CimInstance -className win32_process | select ProcessId,ExecutablePath";
    const lines: string[] = [];

    const proc = spawn("powershell.exe", ["/c", cmd], {
      detached: false,
      windowsHide: true,
    });

    proc.stdout.on("data", (data: Buffer) => {
      lines.push(data.toString());
    });

    proc.on("error", (err) => {
      reject(
        new Error("Command '" + cmd + "' failed with reason: " + err.toString())
      );
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error("Command '" + cmd + "' terminated with code: " + code)
        );
      }

      const list = parseTable(lines.join(""))
        .filter((row) => {
          return pids.includes(row.ProcessId);
        })
        .map((row) => ({
          pid: row.ProcessId,
          bin: row.ExecutablePath,
        }));
      resolve(list);
    });
  });
};
