import { Context } from "hono";
import { HttpStatusCode, NamesiloResponseCode, statusReponse } from "../utils";

type Response = {
  request: {
    operation: string
    ip: string
  };
  reply: {
    code: number | null,
    detail: string | null,
    domain: string | null,
    registered: string | null,
    changed: string | null,
    created: string | null,
    expires: string | null,
    registrar: string | null,
  }
}

export default async function whoIsRoute(context: Context) {
  const domain = context.req.param("domain")

  if (!domain)
    return statusReponse("ERR", "No domain provided", HttpStatusCode.BadRequest, context)

  if (domain.length < 2)
  return statusReponse("ERR (ABORTED)", "Domain is too short.", HttpStatusCode.UnprocessableEntity, context)

  if (domain.length > 64)
  return statusReponse("ERR (ABORTED)", "Domain is too long.", HttpStatusCode.UnprocessableEntity, context)

  let json: Response;

  try {
      const request = await fetch(`https://www.namesilo.com/api/whoisInfo?version=1&type=json&key=${process.env.NAMESILO_APIKEY}&domain=${domain}`)

      if (!request.ok) {
        return statusReponse("ERR", "Request failed.", HttpStatusCode.InternalServerError, context)
      }

      json = await request.json() as Response
  } catch (error: any) {
      console.error(error)
      return statusReponse("ERR", error, HttpStatusCode.InternalServerError, context)
  }

  if (json.reply.changed?.toString() == "false" && json.reply.created === "" && json.reply.expires === "" && json.reply.registrar === "DENIC eG") {
    return statusReponse("OK", {
      domain: json.reply.domain,
      registered: false,
      changed: "",
      created: "",
      expires: "",
      registrar: ""
    }, HttpStatusCode.OK, context)
  }

  return statusReponse("OK", {
    domain: json.reply.domain,
    registered: json.reply.registered === "yes",
    changed: json.reply.changed?.toString() == "false" ? "" : json.reply.changed,
    created: json.reply.created,
    expires: json.reply.expires,
    registrar: json.reply.registrar
  }, HttpStatusCode.OK, context)
}