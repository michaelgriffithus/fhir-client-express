const smart = require("fhirclient");
const session = require("express-session");
const app = require("express")();


// The SMART state is stored in a session. If you want to clear your session
// and start over, you will have to delete your "connect.sid" cookie!
app.use(session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false
}));

// The settings that we use to connect to our SMART on FHIR server
const smartSettings = {
    clientId: "60e0ce24-38a1-4210-8937-ba227cd98fcb",
    redirectUri: "http://localhost:8080/post-launch/",
    scope: "launch/patient openid fhirUser",
    iss: "https://fhir-ehr.sandboxcerner.com/dstu2/0b8a0111-e8e6-4c26-a91c-5069cbc6b1ca"
};

// Just a simple function to reply back with some data (the current patient if
// we know who he is, or all patients otherwise
async function handler(client, res) {
    const data = await (
        client.patient.id ? client.patient.read() : client.request("Patient?name=Peters")
    );
    res.type("json").send(JSON.stringify(data, null, 4));
}

app.get("/launch", (req, res, next) => {
    console.log(`launch client: ${JSON.stringify(smartSettings)}`);
    smart(req, res).authorize(smartSettings).catch(next);
});

// =============================================================================
// APP
// =============================================================================
// The app lives at your redirect_uri (in this case that is
// "https://c0che.sse.codesandbox.io/app"). After waiting for "ready()", you get
// a client instance that can be used to query the fhir server.
app.get("/post-launch", (req, res) => {
    smart(req, res).ready().then(client => handler(client, res));
    //res.json(req.query);
});

// =============================================================================
// SINGLE ROUTE
// =============================================================================
// In case you prefer to handle everything in one place, you can use the "init"
// method instead of "authorize" and then "ready". It takes the same options as
// "authorize"
app.get("/", (req, res) => {
    smart(req, res)
        .init({ ...smartSettings, redirectUri: "/" })
        .then(client => handler(client, res));
});


app.listen(8080);
