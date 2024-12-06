let express = require("express");

let app = express();

let path = require("path");

const bcrypt = require('bcrypt');

const session = require('express-session');

const port = process.env.PORT || 5555; 

app.use(session({
    secret: 'your-secret-key', // Choose a secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Use true for HTTPS, false for HTTP
  }));

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({extended: true}));

// connect to postgres
const knex = require("knex") ({
    client : "pg",
    connection : {
        host : "awseb-e-sin87ts9np-stack-awsebrdsdatabase-ao0fncsub8c4.cnw8e0oim3dp.us-east-2.rds.amazonaws.com",
        user : "ebroot",
        password : "sipfu4-jonmuk-rygwYg",
        database : "ebdb",
        port : 5432,
        ssl: { rejectUnauthorized: false // Set to true for stronger security, false allows unverified SSL certificates
        }
    }
  });
// external landing page
app.get('/', (req, res) => {
    res.render('index', {
        pageTitle: 'Welcome to the Turtle Shelter Project',
        heroText: 'WHAT IS A TURTLE SHELTER VEST? A HIGH TECH BUT SIMPLE SOLUTION TO HELP SAVE LIVES\n- A PORTABLE "SHELTER" YOU CAN CARRY WITH YOU, JUST LIKE A TURTLE...AND YOU CAN HELP!',
        aboutText: 'The Turtle Shelter Project creates life-saving foam vests for the homeless to provide warmth and protection during freezing temperatures. Using innovative foam clothing technology, our vests retain body heat even when wet, offering critical insulation for those exposed to the elements. Every life has value, and we believe no one should suffer in the cold simply because they lack shelter.',
        projects: [
            {
                title: 'Take Action',
                description: 'Join us in creating Turtle Shelter Vests.',
                image: '/images/turtleVests.jpeg'
            },
            {
                title: 'Conservation Education',
                description: 'Teaching communities about sustainable practices.',
                image: '/images/turtleVests.jpeg'
            }
        ]
    });
});

// login
app.get('/login', (req, res) => {
    res.render('login', { error: null }); // Always pass `error` as null if no error
  });

// Route for handling login form submission
// Example of session logging in your login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await knex("admin")
            .where("username", username)
            .first();
        
        if (!user) {
            console.log("User not found");
            return res.render("login", { error: "Invalid username or password" });
        }


        // Ensure bcrypt compare works
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password match:", passwordMatch);

        if (passwordMatch) {
            req.session.user = { id: user.adminid, username: user.username };
            console.log("User logged in:", req.session.user);
            res.render("internalIndex");
        } else {
            res.render("login", { error: "Invalid username or password" });
        }
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).send("Server error");
    }
});


  
// Logout route to block access to internal index
app.get('/logout', (req, res) => {
    // Destroy the session and log the user out
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.redirect('/internalIndex');
      }
      // Redirect to home landing page after logging out
      res.redirect('/');
    });
  });

// internal landing page
app.get('/internalIndex', (req, res) => {
     // Check if the user is logged in
  if (!req.session.user) {
    return res.redirect('/login'); // Redirect to login if not authenticated
    res.render('internalIndex', {
        pageTitle: 'Welcome to the Turtle Shelter Project',
        heroText: 'WHAT IS A TURTLE SHELTER VEST? A HIGH TECH BUT SIMPLE SOLUTION TO HELP SAVE LIVES\n- A PORTABLE "SHELTER" YOU CAN CARRY WITH YOU, JUST LIKE A TURTLE...AND YOU CAN HELP!',
        aboutText: 'Every life has value, Every person can serve!',
        projects: [
            {
                title: 'Take Action',
                description: 'Join us in creating Turtle Shelter Vests.',
                image: '/images/turtleVests.jpeg'
            },
            {
                title: 'Conservation Education',
                description: 'Teaching communities about sustainable practices.',
                image: '/images/turtleVests.jpeg'
            }
        ]
    });
    };
});
// Route for userMaintain page (protected)
app.get("/userMaintain", async (req, res) => {
    // Check if the user is logged in
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    try {
        // Fetch users from the database
        const user = await knex("admin").select("adminid", "adminfirstname", "adminlastname");
        res.render("userMaintain", { user });
    } catch (err) {
        res.status(500).send(err.message); // Handle any database errors
    }
});



// Add user (protected route)
app.get("/addUser", (req, res) => {
    // Check if the user is logged in
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }
    res.render("addUser", { error: null });
});

app.post("/addUser", async (req, res) => {
    const { adminfirstname, adminlastname, username, password } = req.body;

    // checking if passworrds match 
    if (password !== confirmPassword) {
        // Re-render the form with an error message
        return res.render('addUser', { error: 'Passwords do not match. Please try again.' });
    }

    // Hash the password
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, async (err, hashedPassword) => {
        if (err) {
            return res.status(500).send("Error hashing password");
        }
        
        // Insert the new user with the hashed password
        try {
            await knex("admin").insert({
                adminfirstname,
                adminlastname,
                username,
                password: hashedPassword,  // Use hashed password
            });
            res.redirect("/userMaintain");
        } catch (err) {
            res.status(500).send(err.message);
        }
    });
});

// Edit user (protected route)
app.get("/editUser/:id", async (req, res) => {
    // Check if the user is logged in
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }
    
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

// Delete user (protected route)
app.post("/deleteUser", async (req, res) => {
    // Check if the user is logged in
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    try {
        await knex("admin").where("adminid", req.body.adminid).del();
        res.redirect("/userMaintain");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Event maintenance page (protected route)
app.get('/eventMaintain', async (req, res) => {
    // Check if the user is logged in
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    try {
        const events = await knex('eventrequests').select('*'); // Fetch all events
        res.render('eventMaintain', { events }); // Render EJS file and pass events
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).send('Server Error');
    }
});
// add event
app.get('/eventRequest', (req,res) => {
    try{
        const events = knex('eventrequests').select('*');
        res.render('eventRequest', {events});
    } catch (error) {
        console.error('Error fetching events table', error.message);
        res.status(500).send('Server Error');
    }
});
// edit event

// delete event

// change event status

// volunteer form
app.get('/volunteerForm', (req, res) => {
    res.render('volunteerForm', { pageTitle: 'Volunteer Form' });
});

// volunteer maintence page
app.get('/volunteerMaintain', async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    try {
        const volunteers = await knex('volunteers').select('*'); // Query to fetch all volunteers
        res.render('volunteerMaintain', { volunteers });
    } catch (error) {
        console.error("Error fetching volunteers: ", error.message);
        res.status(500).send("Server Error");
    }
});

// add volunteer
app.get('/editVolunteer/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
        
    }

    const { id } = req.params;
    try {
        const volunteer = knex('volunteers').where('id', id).first(); // Fetch the specific volunteer
        res.render('editVolunteer', { volunteer }, );
    } catch (error) {
        console.error("Error fetching volunteer for editing: ", error.message);
        res.status(500).send("Server Error");
    }
});

app.post('/editVolunteer/:id',  (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const { id } = req.params;
    const { first_name, last_name, phone_number, how_found, sewing_level, hours_per_week } = req.body;
    try {
         knex('volunteers')
            .where('id', id)
            .update({ first_name, last_name, phone_number, how_found, sewing_level, hours_per_week });
        res.redirect('/volunteers');
    } catch (error) {
        console.error("Error updating volunteer: ", error.message);
        res.status(500).send("Server Error");
    }
});

// add volunteer (Protected)
app.get('/addVolunteer',  (req,res) => {
    res.render('addVolunteer');
});

app.post('/addVolunteer', (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const { firstName, lastName, phoneNumber, foundUs, sewingLevel, hoursPerWeek } = req.body;

    try {
        knex('volunteers').insert({
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber,
            found_us: foundUs,
            sewing_level: sewingLevel,
            hours_per_week: hoursPerWeek
        })
        .then(() => {
            res.redirect('/volunteerMaintain');
        })
        .catch(err => {
            res.status(500).send('Error saving data: ' + err.message);
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});

// delete volunteer (Protected)
app.post('/deleteVolunteer/:id',  async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const { id } = req.params;
    try {
        await knex('volunteers').where('id', id).del();
        res.redirect('/volunteerMaintain');
    } catch (error) {
        console.error("Error deleting volunteer: ", error.message);
        res.status(500).send("Server Error");
    }
});

// Edit Event (Protected)
app.get('/editEvent/:id',  async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const { id } = req.params;
    try {
        const event = await knex('eventrequests').where('eventID', id).first();
        if (event) {
            res.render('editEvent', { event });
        } else {
            res.status(404).send('Event not found');
        }
    } catch (error) {
        console.error('Error fetching event for editing:', error.message);
        res.status(500).send('Server Error');
    }
});

app.post('/editEvent/:id', async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const { id } = req.params;
    const {
        EventYear,
        eventMonth,
        eventDay,
        eventStreetAddress,
        eventName,
        numAttending,
        eventType,
        eventState,
        eventCity,
        eventZipCode,
        StartTime,
        estimatedDuration,
        eventContactLastName,
        eventContactPhone,
        JenShareStory,
        eventStatus,
        under10Amount,
        NumSewers,
        LocationDescription,
        NumHostSewingMachines,
    } = req.body;
    try {
        await knex('eventrequests')
            .where('eventID', id)
            .update({
                EventYear,
                eventMonth,
                eventDay,
                eventStreetAddress,
                eventName,
                numAttending,
                eventType,
                eventState,
                eventCity,
                eventZipCode,
                StartTime,
                estimatedDuration,
                eventContactLastName,
                eventContactPhone,
                JenShareStory,
                eventStatus,
                under10Amount,
                NumSewers,
                LocationDescription,
                NumHostSewingMachines,
            });
        res.redirect('/eventMaintain');
    } catch (error) {
        console.error('Error updating event:', error.message);
        res.status(500).send('Server Error');
    }
});

// Add Event (Protected)
app.get('/addEvent', (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    res.render('addEvent');
});

app.post('/addEvent',  async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }

    const {
        EventYear,
        eventMonth,
        eventDay,
        eventStreetAddress,
        eventName,
        numAttending,
        eventType,
        eventState,
        eventCity,
        eventZipCode,
        StartTime,
        estimatedDuration,
        eventContactLastName,
        eventContactPhone,
        JenShareStory,
        eventStatus,
        under10Amount,
        NumSewers,
        LocationDescription,
        NumHostSewingMachines,
    } = req.body;
    try {
        await knex('eventrequests').insert({
            EventYear,
            eventMonth,
            eventDay,
            eventStreetAddress,
            eventName,
            numAttending,
            eventType,
            eventState,
            eventCity,
            eventZipCode,
            StartTime,
            estimatedDuration,
            eventContactLastName,
            eventContactPhone,
            JenShareStory,
            eventStatus,
            under10Amount,
            NumSewers,
            LocationDescription,
            NumHostSewingMachines,
        });
        res.redirect('/eventMaintain');
    } catch (error) {
        console.error('Error adding event:', error.message);
        res.status(500).send('Server Error');
    }
});

// Completed Events (Protected)
app.get("/CompletedEvents", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }
    try {
        const completedevents = await knex("completedevents").select(
            "completedeventname",
            "numattended",
            "duration",
            "numpocketsproduced",
            "numcollarsproduced",
            "numvestsproduced",
            "totalcompletedproducts",
            "eventstatus"
        );

        completedevents.forEach(event => {
            // Ensure duration exists and is a string
            if (event.duration && typeof event.duration === 'string') {
                // Split the duration string (HH:mm:ss)
                const [hours, minutes, seconds] = event.duration.split(":");
                event.durationFormatted = `${hours} hours, ${minutes} minutes`;
            } else {
                event.durationFormatted = "N/A"; // If duration is missing or invalid
            }
        });

        res.render("CompletedEvents", { completedevents });
    } catch (err) {
        console.error("Error fetching completed events:", err);
        res.status(500).send("Error fetching completed events: " + err.message);
    }
});
// our tech page
app.get('/ourtech', (req, res) => {
    res.render('ourtech', { pageTitle: 'Our Tech' });
});
// jens story page
app.get('/jensstory', (req, res) => {
    res.render('jensstory', { pageTitle: 'Our Story' });
});
// FAQ page
app.get('/FAQ', (req, res) => {
    res.render('FAQ', { pageTitle: 'FAQ' });
});





// ideas for other pages if time:
// announcments section on internal homepage
// newsletter
// FAQ








app.listen(port, () => console.log("Express App has started and server is listening!"));
