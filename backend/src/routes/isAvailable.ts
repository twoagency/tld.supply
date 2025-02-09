import { Context } from "hono";
import { HttpStatusCode, NamesiloResponseCode, statusReponse } from "../utils";

type Response = {
  request: {
    operation: string
    ip: string
  };
  reply: {
    code: number
    detail: string
    available: Array<{
      domain: string
      price: number
      premium: number
      duration: number
    }>  | {
      domain: {
        domain: string,
        price: number,
        renew: number,
        premium: number,
        duration: number
      }
    } | null
    unavailable: Array<{
      domain: string
    }> | {
      domain: string
    } | null
    invalid: Array<{
      domain: string
    }> | {
      domain: string
    } | null
  }
}

export default async function isAvailableRoute(context: Context) {
  const domains = context.req.param("domains")
  const splitDomain = domains.split(",")

  if (!domains)
    return statusReponse("ERR", "No domain(s) provided", HttpStatusCode.BadRequest, context)

  const tooShortDomain: string[] = []
  const tooLongDomain: string[] = []

  splitDomain.forEach(domain => {
    if (domain.length < 2)
      tooShortDomain.push(domain)
  
    if (domain.length > 64)
      tooLongDomain.push(domain)
  })

  if (tooShortDomain.length != 0 || tooLongDomain.length != 0) {
    return statusReponse("ERR (ABORTED)", {
      domains: {
        tooShortDomain,
        tooLongDomain
      }
    }, HttpStatusCode.UnprocessableEntity, context)
  }

  let json: Response;
  
  try {
    const request = await fetch(`https://www.namesilo.com/api/checkRegisterAvailability?version=1&type=json&key=${process.env.NAMESILO_APIKEY}&domains=${domains}`)

    if (!request.ok) {
      return statusReponse("ERR", "Request failed.", HttpStatusCode.InternalServerError, context)
    }

    json = await request.json() as Response
  } catch (error: any) {
    console.error(error)
    return statusReponse("ERR", error, HttpStatusCode.InternalServerError, context)
  }

  if (json.reply.code !== NamesiloResponseCode.SUCCESSFUL_API_OPERATION || (json.reply.available == null && json.reply.unavailable == null && json.reply.invalid == null)) {
    console.log(json)
    return statusReponse("ERR", {
      namesilo_code: json.reply.code,
      details: json.reply.detail
    }, HttpStatusCode.BadRequest, context)
  }

  const prices: number[] = []

  if (json.reply.available != null) {
    if (json.reply.available instanceof Array) {  
      json.reply.available.forEach(domain => {
        prices.push(domain.price)
      })
    } else prices.push(json.reply.available.domain.price)
  }

  const urlsToRegistrar: string[] = []
  const registrarUrls: string[] = [
    "https://porkbun.com/checkout/search?q=",
    "https://www.dynadot.com/?domain=",
    "https://www.namecheap.com/domains/registration/results/?domain=",
    "https://www.godaddy.com/en-in/domainsearch/find?domainToCheck=",
    "https://www.ionos.de/domainshop/search?domains=",
    "https://us.ovh.com/us/order/webcloud/#/webCloud/domain/select?selection=~()&domain=",
  ]

  if (json.reply.available !== null && json.reply.available instanceof Array) {
    json.reply.available.forEach(domain => {
      registrarUrls.forEach(url => urlsToRegistrar.push(url + domain.domain))
    })
  } else if (json.reply.available !== null) {
    const domain = json.reply.available?.domain.domain
    registrarUrls.forEach(url => urlsToRegistrar.push(url + domain))
  }

  return statusReponse("OK", {
    domains: domains,
    available: json.reply.available == null ? [] : json.reply.available,
    unavailable: json.reply.unavailable == null ? [] : json.reply.unavailable,
    invalid: json.reply.invalid == null ? [] : json.reply.invalid,
    urlsToRegistrar: json.reply.available == null ? [] : urlsToRegistrar
  }, HttpStatusCode.OK, context)
}