var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");

pageMod.PageMod({
  include: [
    "https://soundcloud.com/stream*"
  ],
  contentScriptFile: [
    data.url("jquery.js"),
    data.url("hidecloud.js")
  ],
  contentStyleFile: [
    data.url("hidecloud.css")
  ]
});