const server = Deno.listen({ port: 8080 });

interface StaticFile {
  // should be consistent with Deno URL pathname
  path: string;
  // what this is served as
  contentType: string;
}

const STATIC_FILES: StaticFile[] = [
  ["/index.html", "text/html; charset=utf-8"],
  ["/index.js", "text/javascript"],
  ["/index.wasm", "application/wasm"],
].map(([path, contentType]): StaticFile => ({ path, contentType }));
const INDEX = STATIC_FILES[0];

// server ======================================================================

for await (const conn of server) {
  serveHttp(conn);
}

async function staticResponse(st: StaticFile): Promise<Response> {
  const local_path = `.${st.path}`;
  const file = await Deno.readFile(local_path)
    .catch((err) => {
      console.error(`unable to load file from ${local_path}`);
      console.error(err);
      return undefined;
    });

  if (file === undefined) {
    return new Response("404: file not found.", {
      status: 404,
      headers: {
        "content-type": "text/plain",
      }
    });
  }

  return new Response(file, {
    status: 200,
    headers: {
      "content-type": st.contentType,
    },
  });
}

async function respondTo(ev: Deno.RequestEvent) {
  const { pathname } = new URL(ev.request.url);

  // serve static files
  for (const st of STATIC_FILES) {
    if (pathname == st.path) {
      ev.respondWith(await staticResponse(st));
      return;
    }
  }

  // serve index.html
  ev.respondWith(await staticResponse(INDEX));
}

async function serveHttp(conn: Deno.Conn): Promise<void> {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    respondTo(requestEvent);
  }
}