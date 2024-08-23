let rotateProxies = true;
let p=0;
const fs = require ("fs");
const  cron = require( "node-cron");
const nodemailer  = require("nodemailer");
const puppeteer = require("puppeteer");

  const CLOSE_LOGIN_CSS = 'div.x92rtbv.x10l6tqk.x1tk7jg1.x1vjfegm > div[role="button"]';
const proxies = fs.readFileSync('proxies.txt', 'utf8',).split(/\r?\n/).map(t => t.split(':'));

var arrayOfItems;

var count = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const keywords = [
  "iphone ",
  "samsung ",
  "iphone",
  "samsung",
  "pixel",
  "i phone",
  "iphonex",
  "iphonexs",
  "iphonexr",
  "xs",
  "xr",
  "xs max",
  "iphone11",
  "iphone11pro",
  "11 pro",
  "11pro",
  "11 pro max",
  "iphone12",
  "iphone12pro",
  "12 pro",
  "12pro",
  "12 pro max",
  "12mini",
  "12 mini",
  "iphone13",
  "iphone13pro",
  "13 pro",
  "13pro",
  "13 pro max",
  "13mini",
  "13 mini",
  "iphone14",
  "iphone14pro",
  "14 pro",
  "14pro",
  "14 pro max",
  "14plus",
  "14 plus",
  "iphone15",
  "iphone15pro",
  "15 pro",
  "15pro",
  "15 pro max",
  "15plus",
  "15 plus",
  "S10",
  "s10plus",
  "s10+",
  "s20",
  "s20+",
  "s20plus",
  "note20",
  "note 20",
  "s20fe",
  "s21",
  "s21plus",
  "s21+",
  "s22",
  "s22plus",
  "s22+",
  "s23",
  "s23plus",
  "s23+",
  "s24",
  "s24plus",
  "s24+",
];

// UPDATE WITH YOUR LOCATION REFERENCE FROM STEP 4
let locationRef = "london";

// UPDATE WITH ITEMS YOU WANT TO SEARCH FOR
let searchTerms = ['phone']//, "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15"];


// UPDATE WITH EMAIL YOU WANT TO RECEIVE AT
let emailRecipient = "receipent@gmail.com";

// UPDATE WITH YOUR SENDING EMAIL ACCOUNT
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sender@gmail.com",
    pass: "nyjfvgqemurhrusc",
  },
});

var bufferedMessageSent = false;

// UPDATE WITH YOUR SENDING EMAIL ACCOUNT
function sendEmail(emailRecipient, searchTerm, items) {
  var bufferedMessage = "";
  if (
    new Date().getHours() >= 7 &&
    new Date().getHours() <= 22 &&
    !bufferedMessageSent
  ) {
    let data = fs.readFileSync("./bufferedMessage.txt", "utf-8");
    items.push({
      title: "Listed item during inactive period",
      price: new Date().getDate().toString(),
      link: data ? data : "No items were listed",
    });
    fs.writeFileSync("bufferedMessage.txt", "", "utf-8");
    bufferedMessageSent = true;
  }

  for (var a = 0; a < items.length; a++) {
    try {
      var item_string = `${items[a].title} - ${items[a].price}\n${items[a].link}\n\n`;
      let message = item_string;
      if (new Date().getHours() >= 7 && new Date().getHours() <= 22) {
        const mailOptions = {
          // UPDATE WITH YOUR SENDING EMAIL ACCOUNT
          from: '"London Marketplace Alert" saskatoonfbsender@gmail.com',
          to: emailRecipient,
          subject: `${items[a].title} - ${items[a].price}`,
          text: message,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
          }
        });
      } else {
        bufferedMessage += message;
      }
    } catch (err) {
      console.error(err.message);
      console.log(items[a], "failed to send");
    }
  }
  if (bufferedMessage != "") {
    fs.appendFile("bufferedMessage.txt", bufferedMessage, function (err) {
      if (err) throw err;
      console.log("Saved!");
    });
  }
}



async function getItems() {
  
  const [host, port, username, password] = proxies[p];
  console.log({p,host,port});
  
  if(rotateProxies)p = (p+1)%proxies.length;
  
  fs.readFile("./pastItems.json", "utf-8", function (err, data) {
    arrayOfItems = JSON.parse(data);
  });

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized',
      `--proxy-server=${host}:${port}`

    ]

  });
  const page =  (await browser.pages())[0];
  await page.authenticate({username, password});
  let extraitems = [];
  page.on('response', async (response) => {
    try {
      if ((await response.url()) != "https://www.facebook.com/api/graphql/") return;
      (await response.json())['data']['marketplace_search']['feed_units']['edges'].forEach(
        edg => {
          if (edg['node']['listing']['id'])
            extraitems.push(edg);
        }
      );
    } catch { }
  });
  for (var i = 0; i < searchTerms.length; i++) {
    console.log('getting new items')
    var newItems = [];
    var searchTerm = searchTerms[i].replace(/ /g, "%20");

    console.log(`\nResults for ${searchTerms[i]}:\n`);
    try {
      await page.goto(
        // 'https://api.ipify.org/' 
       `https://www.facebook.com/marketplace/${locationRef}/search?daysSinceListed=1&sortBy=creation_time_descend&query=${searchTerm}&exact=false`
      );
    } catch (err) {
      console.log('issue  ' + err);
      continue;
    }
    // await delay(5000);
    // await browser.close();
    // return;
    await page.$eval(CLOSE_LOGIN_CSS, page => page.click());


    for (let i = 0; i <= 3; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // // Wait for a short delay to allow content to load
      await delay(2000);
    }

    await delay(5000);
    let bodyHTML = await page.evaluate(() => document.body.outerHTML);
    await delay(5000);


    try {
      let searchResults = bodyHTML.split(
        /(?:"marketplace_search":|,"marketplace_seo_page")+/
      );

      let searchResult;

      try {
        searchResult = searchResults[1].split(
          ',"viewer":{"marketplace_settings"'
        )[0];
        searchResult = JSON.parse(searchResult);
      } catch (err) {
        try {
          searchResult = searchResults[2].split(
            ',"viewer":{"marketplace_settings"'
          )[0];
          searchResult = JSON.parse(searchResult);
        } catch (err) {
          console.log(err, "Failed all attempts to parse search results");
          continue;
        }
      }
      // console.dir(searchResult, { depth: null });

      await delay(5000);

      let items = [...searchResult["feed_units"]["edges"], ...extraitems];
      console.log('ITEMS: ' + items.length);

      await delay(5000);
      if (items.length > 1) {
        for (let val of items) {
          listing = val["node"]["listing"];
          if (!listing) continue;
          var ID1 = val["node"]["listing"]["id"];
          var link = `https://www.facebook.com/marketplace/item/${val["node"]["listing"]["id"]}`;
          var title = val["node"]["listing"]["marketplace_listing_title"];
          var price =
            val["node"]["listing"]["listing_price"]["formatted_amount"];
          var item = { title: title, price: price, link: link };
          console.log(item);
          temp = price.slice(3, price.length);
          compPrice = temp.replace(/,/, "");

          compTitle = title.toLowerCase();

          var mCheck = 0;

          if (arrayOfItems.pastItems.includes(ID1)) {
          } else {
            arrayOfItems.pastItems.push(ID1);
            for (let j = 0; j < keywords.length; j++) {
              if (compTitle.includes(keywords[j])) {
                mCheck = 1;
                break;
              } else {
              }
            }
            console.log(mCheck);
            if (mCheck == 1 && Number(compPrice) > 50) {
              var item = { title: title, price: price, link: link };
              if ((Number(compPrice) >= 50 && Number(compPrice) < 200 && (Number(compPrice) % 10) !== 0) || (Number(compPrice) == 130 || Number(compPrice) == 150 || Number(compPrice) == 170)) {
              } else {
                newItems.push(item);
              }
            } else {
              var item = "";
            }
          }
        }
      }
    } catch (err) {
      console.error(err.message);
    }
    if (newItems.length > 0) {
      sendEmail(emailRecipient, searchTerms[i], newItems);
    } else {
      console.log("No new items for " + searchTerms[i]);
    }
  }
  await browser.close();
  fs.writeFile(
    "./pastItems.json",
    JSON.stringify(arrayOfItems),
    "utf-8",
    function (err) {
      if (err) console.log(err, "error");
      console.log("Updated past items");
    }
  );
}
main = async () =>{while(true){await getItems();}};
main()
// TO CHANGE CRON TIME SCHEDULE https://www.npmjs.com/package/node-cron
// var shouldReRun = true

//  cron.schedule('*/6 * * * *', async function() {
//    if(shouldReRun){
//        shouldReRun = false
//        if (new Date().getHours() >= 7 && new Date().getHours() <= 22){ 
// 		await getItems()
// 	   }
//        shouldReRun = true
//    }
//  });
