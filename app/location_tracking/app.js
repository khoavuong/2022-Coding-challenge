const WIDTH = 1200;
const HEIGHT = 800;

const LINE_X = 60;
const LINE_Y = 60;
const UNIT_WIDTH = WIDTH / LINE_X;
const UNIT_HEIGHT = HEIGHT / LINE_Y;

const TOOLTIP_STYLE = new PIXI.TextStyle({
    fill: "white",
    fontSize: 16,
});

const app = new PIXI.Application({
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: 0x000000,
});

document.getElementById('app').appendChild(app.view);

let serverIncidents = [];
let serverOfficers = [];

async function fetchData() {
    serverIncidents = []
    serverOfficers = []
    const {data} = await axios.get("http://localhost:5000")
    const jsonData = data.map(item => JSON.parse(item));
    console.log('khoa -> jsonData', jsonData)
    jsonData.forEach(item => {
        if (Boolean(item.incidentId)) {
            if (item.type === "IncidentOccurred") {
                serverIncidents.push({
                    id: item.incidentId,
                    codeName: item.codeName,
                    officerId: 3,
                    loc: item.loc,
                })
            }

            if (item.type === "IncidentResolved") {
                serverIncidents = serverIncidents.filter(incident => incident.id !== item.incidentId);
            }
            // Officer
        } else {
            if (item.type === "OfficerGoesOnline") {
                serverOfficers.push({
                    id: item.officerId,
                    badgeName: item.badgeName,
                    loc: item.loc,
                })
            }

            if (item.type === "OfficerLocationUpdated") {
                serverOfficers.find(officer => officer.id === item.officerId).loc = item.loc
            }

            if (item.type === "OfficerGoesOffline") {
                serverOfficers = serverOfficers.filter(officer => officer.id !== item.officerId)
            }
        }
    })
}

function drawMap() {
    const graphics = new PIXI.Graphics();

    graphics.lineStyle(1, 0x424242, 0.8);

    for (let i = 0; i < LINE_X; i++) {
        graphics.moveTo((i + 1) * UNIT_WIDTH, 0);
        graphics.lineTo((i + 1) * UNIT_WIDTH, HEIGHT);
    }

    for (let i = 0; i < LINE_Y; i++) {
        graphics.moveTo(0, (i + 1) * UNIT_HEIGHT);
        graphics.lineTo(WIDTH, (i + 1) * UNIT_HEIGHT);
    }

    graphics.closePath();
    app.stage.addChild(graphics);
}

function drawTooltip(text, graphics, x, y) {
    const tooltip = new PIXI.Text(text, TOOLTIP_STYLE);
    tooltip.x = x * UNIT_WIDTH;
    tooltip.y = y * UNIT_HEIGHT;
    tooltip.anchor = {x: 0.5, y: 1};

    app.stage.addChild(tooltip);
}

function drawIncidents(incidents) {
    return incidents.map((incident) => {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xbf360c, 1);
        graphics.drawCircle(
            incident.loc.x * UNIT_WIDTH,
            incident.loc.y * UNIT_HEIGHT,
            UNIT_WIDTH
        );

        graphics.alpha = Math.random();
        graphics.alphaDirection = 1;

        app.stage.addChild(graphics);

        drawTooltip(incident.codeName, graphics, incident.loc.x, incident.loc.y);

        return graphics;
    });
}

function drawOfficers(officers) {
    officers.forEach((officer) => {
        const graphics = new PIXI.Graphics();

        graphics.beginFill(0x37b218, 1);
        graphics.drawCircle(
            officer.loc.x * UNIT_WIDTH,
            officer.loc.y * UNIT_HEIGHT,
            UNIT_WIDTH / 2
        );

        app.stage.addChild(graphics);

        drawTooltip(officer.badgeName, graphics, officer.loc.x, officer.loc.y);
    });
}

function drawAssignLines(incidents, officers) {
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(2, 0x37b218, 1);

    incidents.forEach((incident) => {
        const officer = officers.find((o) => o.id === incident.officerId);
        graphics.moveTo(
            incident.loc.x * UNIT_WIDTH,
            incident.loc.y * UNIT_HEIGHT
        );
        graphics.lineTo(
            officer.loc.x,
            officer.loc.y
        );
    });

    app.stage.addChild(graphics);
}

let incidentGraphics = [];

function start() {
    app.ticker.add((delta) => {
        incidentGraphics.forEach((g) => {
            if (g.alpha >= 1) {
                g.alphaDirection = -1;
            }

            if (g.alpha <= 0.6) {
                g.alphaDirection = 1;
            }

            g.alpha += 0.005 * g.alphaDirection;
        });
    });

    loop();
    setInterval(loop, 5000);
}

async function loop() {
    try {
        const resp = await loadData();

        app.stage.removeChild(...app.stage.children);

        drawMap();

        const {incidents, officers} = resp.data;

        drawAssignLines(incidents, officers);
        drawOfficers(officers);
        incidentGraphics = drawIncidents(incidents);
    } catch (err) {
        console.error(err);
    }
}

const sampleIncidents = [
    {id: 1, codeName: "IC1", loc: {x: 5, y: 10}, officerId: 1},
    {id: 2, codeName: "IC200", loc: {x: 15, y: 20}, officerId: 3},
    {id: 3, codeName: "IC3", loc: {x: 25, y: 20}, officerId: 2},
];

const sampleOfficers = [
    {id: 1, badgeName: "OF1", loc: {x: 8, y: 12}},
    {id: 2, badgeName: "OF2", loc: {x: 19, y: 20}},
    {id: 3, badgeName: "OF3", loc: {x: 10, y: 20}},
];

async function loadData() {
    await fetchData()
    console.log('khoa -> sampleIncidents', sampleIncidents)
    console.log('khoa -> sampleOfficers', sampleOfficers)
    console.log('khoa -> serverOfficers', serverOfficers)
    console.log('khoa -> serverIncidents', serverIncidents)
    return {
        data: {
            incidents: serverIncidents,
            officers: serverOfficers,
        },
        error: null,
    };
}

start();
