export default async function handler(req, res) {

const keywords = [
"marbre",
"travertin",
"granit",
"quartz",
"quartzite",
"dekton",
"porcelanosa",
"infinity",
"corian",
"pierre",
"opus",
"parement",
"revêtement",
"dallage"
]

const response = await fetch(
"https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records?limit=100"
)

const data = await response.json()

const filtered = data.results.filter(item => {

const text = JSON.stringify(item).toLowerCase()

return keywords.some(k => text.includes(k))

})

return res.status(200).json({
ok:true,
total: filtered.length,
results: filtered.slice(0,20)
})

}
