let express = require("express");

let app = express();

let path = require("path");

const port = 5555; 

let security = false;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({extended: true}));

// connect to postgres
const knex = require("knex") ({
    client : "pg",
    connection : {
    host : "localhost",
    user : "postgres",
    password : "admin",
    database : "TSP",
    port : 5432
    }
});

// external landing page

// internal landing page

// login page - use security variable

// user maintenance page
app.get("/userMaintain", async (req, res) => {
    try {
        const users = await knex("admin").select("adminid", "adminfirstname", "adminlastname", "adminphone");
        res.render("userMaintain", { users });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// add user
app.get("/addUser", (req, res) => {
    res.render("addUser");
});

app.post("/addUser", async (req, res) => {
    const { adminfirstname, adminlastname, username, password } = req.body;
    try {
        await knex("admin").insert({
            adminfirstname,
            adminlastname,
            username,
            password,
        });
        res.redirect("/userMaintain");
    } catch (err) {
        res.status(500).send(err.message);
    }
});
// edit user
app.get("/editUser/:id", async (req, res) => {
    try {
        const user = await knex("admin").where("adminid", req.params.id).first();
        if (user) {
            res.render("editUser", { user });
        } else {
            res.status(404).send("User not found");
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/editUser/:id", async (req, res) => {
    const { adminfirstname, adminlastname } = req.body;
    try {
        await knex("admin")
            .where("adminid", req.params.id)
            .update({
                adminfirstname,
                adminlastname,
            });
        res.redirect("/userMaintain");
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// delete user
app.post("/deleteUser", async (req, res) => {
    try {
        await knex("admin").where("adminid", req.body.adminid).del();
        res.redirect("/userMaintain");
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// event maintenace page 

// add event

// edit event

// delete event

// change event status

// volunteer maintence page

// add volunteer

// edit volunteer 

// delete volunteer





// ideas for other pages if time:
// announcments section on internal homepage
// newsletter
// FAQ








app.listen(port, () => console.log("Express App has started and server is listening!"));