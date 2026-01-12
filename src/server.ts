import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import zod from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const server = new McpServer({
  name: "my-app",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
    prompts: {},
  },
});

server.tool(
  "create-user",
  "Create a new user in the database",
  {
    name: zod.string(),
    email: zod.string(),
    address: zod.string(),
    phone: zod.string(),
  },
  {
    title: "Create User",
    readOnlyHint: false,
    destructiveHint:false,
    idempotentHint:false,
    openWorldHint:true,
  },
  async (params) => {
    try {
      const id = await createUser(params);
      return {
        content: [{ type: "text", text: `User created successfully (ID: ${id})` }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: "Failed to save user" }],
      };
    }
  }
);

async function createUser(user: {
  name: string;
  email: string;
  address: string;
  phone: string;
}) {
  const users = await import("./data/users.json", { with: { type: "json" } }).then(
    (m) => m.default
  );
  const id = users.length + 1;
  users.push({ id, ...user });
  await fs.writeFile("./src/data/users.json", JSON.stringify(users, null, 2));
  return id;
}

server.resource(
  "company-policy",                                   
  "resource://docs/company-policy",                   
  {
    title: "Company Policy and Procedures",
    description: "A PDF document containing company policy guidelines",
    mimeType: "text/plain", 
  },
  async (uri) => {
    const text = await extractPdfText();
    return {
       contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text,
        },
      ],
    };
  }
);

async function extractPdfText() {
  const pdfPath = path.resolve( "C:\\Users\\etim-marcel.ekpe\\Documents\\Company-Policy-and-Procedure-June-1.18-V6.0.pdf");
  const pdfBuffer = await fs.readFile(pdfPath);
  const parser = new PDFParse({ data: pdfBuffer });
  const result = await parser.getText();
  await parser.destroy();

  return result.text;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
});
