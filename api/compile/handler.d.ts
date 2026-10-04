export function handleCompileApi(req: any, res: any): Promise<boolean>;
export function executeCodeServer(
  code: string,
  langOrId: string | number,
  stdin?: string,
  timeoutMs?: number
): Promise<{
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string;
  memory: number | null;
  exit_code: number;
  engine: string;
}>;
