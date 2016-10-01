let express = require('express')
let app = express()
let port = process.env.PORT || 3000
let OAuth = require('oauth')
let OAuth2 = OAuth.OAuth2
let https = require('https')
let myoauth = new OAuth2()
let path = require('path')
var access_token = "154606959-uWvssleXi2eMsKXoFS0Z0Rg3GSILEVpbdDb9ucmh"
var token_secret = "iEwx1kUPOR1BLdNVwz3jjq1FIIJ8UxAUF1EJQufccIPUy"
var consumer_key = "1ZktIjZwVjBrWtf9IrO8x23e2"
var consumer_secret = "ONbiaBuU5xSqf1qFBci1eTmMnx3NzpqYJUhwNgnx7HvEaIDCDh"
let bodyParser = require('body-parser')

app.use(bodyParser.urlencoded( {extended:true} ))
app.use(express.static(path.join(__dirname, 'less')));
app.use(express.static(path.join(__dirname, 'jsmansory')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'cssmansory')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'vendors')));

var getFB = function(cari,token,callback){
     var req = require('request');
     req("https://graph.facebook.com/search?q="+cari+"&type=page&limit=100&access_token="+token, function (error, response, body) {
       if (!error && response.statusCode == 200) {
         var hasil = (JSON.parse(body))
         callback(hasil)
       }
     })
   }

   var olahFB = function(token,hasilid, hasilname,callback){
     var req = require('request');
       req("https://graph.facebook.com/"+hasilid+"?fields=fan_count,link,name,picture&access_token="+token, function (error, response, body) {
         var hasil2 = (JSON.parse(body))
         callback(hasil2, hasilname)
       })
   }

//authorize
function fb(cari,callback){
     var https    = require('https')
     var rp = require('request-promise');
     var token = "EAAY2YaqX8yoBAHwPiArT29xOsWYkxW56kvsmBqF81BTeF92DSlTZCmqnFiTTzAziU4wavZBaWYlthfaeglK54Xwqc68Cx2xx5tay1Bsqz1rRUqej7F2CHhOdNWPywUb2N57dPfksguxznKVwWeQsf2pd1d6UgprZBNFoQohgwZDZD"
     var fanPage = []
     getFB(cari,token,function(hasil){
       var ar = []
       var z = 0
       for (var i in hasil.data){
         olahFB(token, hasil.data[i].id, hasil.data[i].name,function(hasil2, hasilname){
           fanPage.push({name: hasilname, fan_count: hasil2.fan_count, link:hasil2.link, picture:hasil2.picture})
           if(fanPage.length ==  hasil.data.length){
             console.log(fanPage[0].picture.data.url);
             fanPage.sort(function(a,b){
               if (a.fan_count < b.fan_count) {
                 return 1;
               }
               if (a.fan_count > b.fan_count) {
                 return -1;
               }
               return 0;
               })
             callback(fanPage)
          }

      })
    }
  })
}
//authorize


app.set('view-engine', 'ejs')

app.get('/', function(req,res){
  res.render('home.ejs')
})

app.post('/result', function(req,res){
  fb(req.body.search, function(hasilfb){
    tweeter(req.body.search,function(hasiltweet){
      dapatkanVideo(req.body.search,function(result){
        let hasil = JSON.parse(result)
        for (let i in hasil.items){
          dapatkanViewCount(hasil.items[i].id.videoId, function(result){
            // console.log(result)
            let hasilview = JSON.parse(result)
            hasil.items[i].viewCount = hasilview.items[0].statistics.viewCount
            if(i == hasil.items.length-1){
              console.log(hasilfb[0].picture.data.url)
              res.render('profile.ejs',{hasiltweet:hasiltweet, hasil: hasil, hasilfb: hasilfb})
            }
          })
        }
      })
    })
  })
})

app.get('/v', function(req,res){
  dapatkanViewCount("taufik+hidayat",function(result){
    // let hasil = JSON.parse(result)
    res.render('result.ejs',{hasil: result})
    // console.log(result)
  })
})

app.listen(port, function(){
  console.log('listening on', port)
})

let dapatkanVideo = function(input,callback){
  https.get({
    host: 'www.googleapis.com',
    path: '/youtube/v3/search?part=snippet&q='+input+'&type=video&key=AIzaSyCp33l3IYhWypewNELCDblLQDkh6Yy8Odc&order=viewCount'
  }, function(response) {
      let hasil = ""
      response.on('data', function(d) {
        hasil += d
      });
      response.on('end', function() {
        // console.log(hasil)
        callback(hasil)
      });
  });
}

let dapatkanViewCount = function(id, callback){
  https.get({
    host:'www.googleapis.com',
    path:`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${id}&key=AIzaSyCp33l3IYhWypewNELCDblLQDkh6Yy8Odc`
  }, function(response){
    let hasil =""
    response.on('data', function(d){
      // console.log(d.toString('utf-8'))
      hasil += d
    });
    response.on('end', function(){
      // console.log(hasil)
      callback(hasil)
    })
  })
}






var tweeter = function(input,callback) {
          var oauth = new OAuth.OAuth(
              'https://api.twitter.com/oauth/request_token',
              'https://api.twitter.com/oauth/access_token',
              consumer_key,
              consumer_secret,
              '1.0A',
              null,
              'HMAC-SHA1'
          );
          oauth.get(
              'https://api.twitter.com/1.1/search/tweets.json?q=' + input + '&count=5',
              access_token, //test user token
              token_secret, //test user secret
              function(e, data, response) {
                if (e) console.error(e);
                  //res.json(tweets)

                let tweetsParse = JSON.parse(data);

                tweetsParse.statuses.sort(function(vala, valb) {
                          return valb.retweet_count - vala.retweet_count
                      })
                      //console.log(tweetsParse.statuses[0].retweet_count);
                callback(tweetsParse)
                      // res.render('index', {
                      //     tweets: tweetsParse
                      //
                      // })
              })

};
