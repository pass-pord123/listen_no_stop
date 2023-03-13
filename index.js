let express = require('express');
let app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // parses the urlencoded body

let handlebars = require("express-handlebars");
app.engine("handlebars", handlebars({ defaultLayout: false }));
app.set("view engine", 'handlebars');

let sqlite3 = require('sqlite3').verbose(); // verbose mode for debugging
let db = new sqlite3.Database("./db.sqlite3");

let session = require("express-session");

let fs = require("fs");
let multer = require("multer"); // npm install multer
let uploader = multer({ dest: "uploads" }); // upload to the "uploads" folder
app.use(express.static('uploads')); // set the uploads folder as static
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/getFiles", function(req, res) {
    db.all("SELECT * FROM file_upload ORDER BY time_added DESC", [], function(err, rows) {
        res.json({ files: rows });
    });
});
app.post("/upload", uploader.single("myFile"), function(req, res) {
    console.log(req.file)
    res.redirect("back");
})

// use it in our app
app.use(
    session({
        secret: "some secret code",
        resave: false, // forces sessions to be saved
        saveUninitialized: false // forces uninitialized sessions to be saved
    })
);

app.get("/count", function(req, res) {
    if (!req.session['count']) { // if 'count' is not found in the user's session
        req.session['count'] = 0; // set the initial value to 0
    }
    req.session['count']++;
    res.send("Count: " + req.session['count']);
})

app.get('/', function(req, res) {
    res.render("login")
});

app.get('/after', function(req, res) {
    res.render("posts", {
        layout: "main",
    });
});

app.post("/login", function(req, res) {
    let username = req.body['username'];
    let password = req.body['password'];
    db.get("SELECT * FROM user WHERE username=? AND password=?", [username, password], function(err, row) {
        //console.log(err)
        if (row) {
            req.session['username'] = username;
            res.redirect("/after");
        } else {
            res.send("Invalid login information.");
        }
    })
});

app.get('/regi', function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    // console.log(req.file);
    let username = req.body['username'];
    let password = req.body['password'];
    db.run("INSERT INTO user(Username,Password) VALUES(?,?)", [username, password], function(err) {
            res.render("login")
        })
        // db.run("INSERT INTO file_upload(filename) VALUES(?)", [
        //     req.file.filename,
        // ]);
        // res.redirect("back");
});
app.get("/checkUser", function(req, res) {
    let username = req.query['username'];
    db.get("SELECT * FROM user WHERE username = ?", username, function(err, row) {
        if (row) {
            res.json({ "available": false }); -
            console.log(username)
        } else {
            res.json({ "available": true });
        }
    });

})

app.get("/logout", function(req, res) {
    req.session.destroy();
    res.redirect("/");
});

app.get("/zt", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id<9 ", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});

app.get("/dw", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id>8 AND id<17", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});

app.get("/jk", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id>16 AND id<25 ", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});

app.get("/jr", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id>24 AND id<31 ", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});

app.get("/cy", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id>30 AND id<39 ", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});

app.get("/xiaoyuan", function(req, res) {
    db.all("SELECT * FROM sourcelist WHERE id>38 AND id<46 ", [], function(err, rows) {
        console.log(rows);
        res.render("sourcelists", {
            "sourcelists": rows,
        });
    });
});


app.get('/top/:id', function(req, res) {
    let postID = req.params['id'];
    db.all("SELECT * FROM listen WHERE id=?", postID, function(err, rows) {
        console.log(rows)
        res.render("compare", {
            layout: "main",
            "listen": rows

        });
    })
});

app.get('/topic/:id', function(req, res) {
    let postID = req.params['id'];
    db.get("SELECT * FROM sourcelist WHERE id=?", postID, function(err, sourcelist) {
        console.log(err)
        db.all("SELECT * FROM listen WHERE list_id=?", postID, function(err, rows) {
            // if(rows.length===0){
            //     res.send("ok")
            //     return
            // }
            // console.log(123, rows);

            res.render("write", {
                layout: "main",
                "sourcelist": sourcelist,
                "listen": rows

            });
        })

    })

})

app.get('/index/:id', function(req, res) {
    let postID = req.params['id'];
    db.get("SELECT * FROM listen WHERE id=?", postID, function(err, listen) {
        db.all("SELECT *,   DATETIME(time_added,'localtime') as time_added FROM comment WHERE co_id=?", postID, function(err, comments) {
            res.render("com", {
                layout: "main",
                "listen": listen,
                "comments": comments
            });
        })
    })
})



//     app.get('/topic/:id', function(req, res) {
//         let postID = req.params['id'];
//         db.get("SELECT * FROM sourcelist WHERE id=?", postID, function(err, sourcelist) {
//         db.all("SELECT *,   DATETIME(time_added,'localtime') as time_added FROM comment WHERE co_id=?", postID, function(err, comments) {
//                 res.render("com", {
//                     layout: "main",
//                     "sourcelist": sourcelist,
//                     "comments": comments
//                 });
//             })
//     })
// })

app.post("/topic/:index", function(req, res) {
    let content = req.body["content"];
   
    let id = req.params.index;
    db.run("INSERT INTO comment(co_id, content) VALUES(?,?)", [id, content], function(err) {

        res.redirect("back");
    });
    let con = req.body["con"];
    db.run("UPDATE listen SET neirong =? WHERE id = ?", [con, id], function(err) {
        //    res.send(req.body)

    })
})


app.post("/topic/:in", function(req, res) {
    let con = req.body["con"];
    let iddle = req.params.in;
    db.run("INSERT INTO answer(lo_id, con) VALUES(?, ?)", [iddle, con], function(err) {

        // res.redirect("back");
    });

});



app.get("/deletee/:id", function(req, res) {
    db.run("DELETE FROM comment WHERE id=?",
        req.params['id'],
        function(err) {
            res.redirect("back")
        });
});

app.get('/news', function(req, res) {
    res.render("new");
});
app.get('/contact', function(req, res) {
    res.render("contact");
});
app.get('/about', function(req, res) {
    res.render("about");
});





app.listen(8000, function() {
    console.log('listening on port 8000!');
});