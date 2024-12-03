let express = require("express");

let app = express();

let path = require("path");

const port = 5050; 

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
        password : "SQL1",
        database : "intex",
        port : 5432
    }
});
// external landing page
app.get('/', (req, res) => {
    res.render('index', {
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
});

// login
app.get('/login', (req,res) => {
    res.render('login')
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        // Query the user table to find the record
        const user = knex('admin')
            .select('*')
            .where({ username, password }) // Replace with hashed password comparison in production
            .first(); // Returns the first matching record
        if (user) {
            security = true;
        } else {
            security = false;
        }
    } catch (error) {
        res.status(500).send('Database query failed: ' + error.message);
    }
    res.redirect("/internalIndex")
});
// internal landing page
app.get('/internalIndex', (req, res) => {
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
});
// user maintenance page

// add user

// edit user

// delete user

// event maintenace page 

// add event

// edit event

// delete event

// change event status

// volunteer maintence page

// add volunteer
app.get('/volunteerForm', (req, res) => {
    res.render('volunteerForm', { pageTitle: 'Volunteer Form' });
});

app.post('/submitVolunteer', (req, res) => {
    const { firstName, lastName, phoneNumber, foundUs, sewingLevel, hoursPerWeek } = req.body;

    // Store or process the data
    try {
        // Example: Inserting data into a 'volunteers' table in the database
        knex('volunteers').insert({
            first_name: volfirstname,
            last_name: vollastname,
            phone_number: volphone,
            found_us: wherefound,
            sewing_level: sewinglevel,
            hours_per_week: numhoursvolunteering
        })
        .then(() => {
            res.send('Thank you for volunteering! Your submission has been received.');
        })
        .catch(err => {
            res.status(500).send('Error saving data: ' + err.message);
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
});
// edit volunteer 
app.get('/editVolunteer/:id', (req, res) => {
    const { id } = req.params.id;
    try {
        const volunteer = knex('volunteers').where('id', id).first(); // Fetch the specific volunteer
        res.render('editVolunteer', { volunteer });
    } catch (error) {
        console.error("Error fetching volunteer for editing: ", error.message);
        res.status(500).send("Server Error");
    }
});

app.post('/editVolunteer/:id', (req, res) => {
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

app.get('/addVolunteeer', (req,res) => {
    res.render('addVolunteer')
});

app.post('/addVolunteer', (req, res) => {
    const { firstName, lastName, phoneNumber, foundUs, sewingLevel, hoursPerWeek } = req.body;

    // Store or process the data
    try {
        // Example: Inserting data into a 'volunteers' table in the database
        knex('volunteers').insert({
            first_name: volfirstname,
            last_name: vollastname,
            phone_number: volphone,
            found_us: wherefound,
            sewing_level: sewinglevel,
            hours_per_week: numhoursvolunteering
        })
        .then(() => {
            res.send('Thank');
        })
        .catch(err => {
            res.status(500).send('Error saving data: ' + err.message);
        });
    } catch (error) {
        res.status(500).send('Server error: ' + error.message);
    }
    res.redirect('/volunteerMaintain');
});
// Route to fetch and display all volunteers
app.get('/volunteerMaintain', async (req, res) => {
    try {
        const volunteers = await knex('volunteers').select('*'); // Query to fetch all volunteers
        res.render('volunteerMaintain', { volunteers });
    } catch (error) {
        console.error("Error fetching volunteers: ", error.message);
        res.status(500).send("Server Error");
    }
});

// delete volunteer
app.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await knex('volunteers').where('id', id).del(); // Deletes the volunteer
        res.redirect('/volunteerMaintain'); // Redirect back to the list
    } catch (error) {
        console.error("Error deleting volunteer: ", error.message);
        res.status(500).send("Server Error");
    }
});



// ideas for other pages if time:
// announcments section on internal homepage
// newsletter
// FAQ








app.listen(port, () => console.log("Express App has started and server is listening!"));