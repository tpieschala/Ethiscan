const app = require('express')();
const axios = require('axios');
const vader = require('vader-sentiment');
const cors = require('cors');
var Twitter = require('twitter');
const PORT = 8080;
const local = "127.0.0.1"
const hostname = "192.168.137.97"

app.use(cors({
    origin: '*'
}));

app.listen(
    PORT, hostname,
    () => console.log(`Listening on http://${hostname}:${PORT}/`)
)

app.get('/test', (req, res) => {
    res.status(200).send({
        "Logo":"https://logos-world.net/wp-content/uploads/2020/09/Nestle-Logo.png",
        "Name":"Nestle",
        "Description":"Its a company and they suck lmao",
        "Articles":{
            "article1":"Google.com",
            "article2":"Facebook.com",
            "article3":"Twitter.com"
        },
        "EnvScore":1,
        "HumanRightsScore":0.5,
        "Location":"Hillside Dr, Fallbrook, CA 92028"
    })
});

app.post('/test/:id', async (req, res) => {

    const { id } = req.params;

    const finalJson = await getAllData(id)

    res.status(200).send(finalJson)
});

async function getAllData(id) {
    let brand = await CompanyFromUPC(id)
    let companyName = await parentCompanyFromBrand(brand);
    let articlesArray = await ArticlesFromCompany(companyName)
    let sentimentScore = await getArticleSentimentRating(articlesArray)
    finalJson = {
        "Name": companyName,
        "Articles":{
            articlesArray
        },
        "HumanRightsScore": ((sentimentScore*5)+10)*10
    }
    console.log(finalJson)
    return {
        "Name": companyName,
        "Articles":{
            articlesArray
        },
        "HumanRightsScore": ((sentimentScore*5)+10)*10
    }
}

function getArticleSentimentRating(articles) {
    sentimentArray = []
    for (i = 0; i < articles.length; ++i) {
        rating = vader.SentimentIntensityAnalyzer.polarity_scores(articles[i])
        sentimentArray.push(rating)
    }

    TotalRating = 0

    for (i = 0; i < sentimentArray.length; ++i) {
        console.log(sentimentArray[i].compound)
        TotalRating += sentimentArray[i].compound
    }

    return TotalRating
}


function parentCompanyFromBrand(brandname){
    brandname = String(brandname)
    let brandarray = brandname.split(" ")
    brandname = "";
    for (i = 0; i < brandarray.length; ++i){
        brandarray[i] = brandarray[i][0].toUpperCase() + brandarray[i].substring(1);
        if (brandarray.length-1 == i){
            brandname += brandarray[i];
        } else {
            brandname += brandarray[i] + "_";
        }
    }


    const promise = axios.get('https://en.wikipedia.org/w/rest.php/v1/page/'+brandname)
    const datapromise = promise.then((res) => findWikiData(res))


    return datapromise
}

function ArticlesFromCompany(company){
    const promise = axios.get('https://newsapi.org/v2/everything?q='+company+'&apiKey=90f39bc4b95f47fdb09f84c750b5b683')
    const datapromise = promise.then((res) => GetArrayOfArticles(res.data.articles))

    return datapromise
}

function GetArrayOfArticles(articles){
    const articleArray = []

    for (i = 0; i < articles.length; ++i) {
        articleArray.push(articles[i].title)
    }

    return articleArray
}

function findWikiData(res) {

        splitstr = ""
        if (res.data.source.search("owner") != -1){
            splitstr = res.data.source.substr(res.data.source.search("owner"), res.data.source.search("owner")+100)
            splitstr = String(splitstr).substr(0,splitstr.search("]]"))
            splitstr = String(splitstr).substr(splitstr.search("\\["))
            splitstr = String(splitstr).substr(2)
            console.log(splitstr)
        } else if (res.data.source.search("manufacturer")) {
            splitstr = res.data.source.substr(res.data.source.search("manufacturer"), res.data.source.search("manufacturer")+100)
            splitstr = String(splitstr).substr(0,splitstr.search("]]"))
            splitstr = String(splitstr).substr(splitstr.search("\\["))
            splitstr = String(splitstr).substr(2)
            console.log(splitstr)
        } else {
            splitstr = "0"
        }

        return splitstr
}

function CompanyFromUPC(text){
    const promise = axios.get('https://api.upcitemdb.com/prod/trial/lookup?upc='+text)
    // const dataPromise = promise.then((res) => res.data.result.names[0].cw_id)
    const dataPromise = promise.then((res) => res.data.items[0].brand)
    

    return dataPromise
}
