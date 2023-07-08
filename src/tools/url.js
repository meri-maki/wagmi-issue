export function queryStringToObject(queryString) {
  const object = {};

  queryString
    .split("&")
    .filter(function(item) {
      return item.length > 0;
    })
    .forEach(function(item) {
      const parts = item.split("=");
      object[parts[0]] = decodeURIComponent(parts[1]);
    });

  return object;
}

export function objectToQueryString(object) {
  const params = [];
  for (let key in object) {
    params.push(key + "=" + encodeURIComponent(object[key]));
  }

  return params.join("&");
}

export function appendParamsToUrl(url, params) {
  const _url = new URL(url);

  if (typeof params === "object") {
    for (let key in params) {
      _url.searchParams.append(key, params[key]);
    }
  }

  return _url.toString();
}