const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDetailsDbToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//Get All Players Query
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT * 
    FROM player_details;
    `;
  const playersQuery = await db.all(getPlayersQuery);
  response.send(
    playersQuery.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseObject(eachPlayer)
    )
  );
});

//Get a Specific Player Based on ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * 
    FROM player_details 
    WHERE player_id = ${playerId};
    `;
  const playerQuery = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsDbToResponseObject(playerQuery));
});

//Update a Specific Player Query
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details 
    SET 
    player_name = '${playerName}' 
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Get Match Details of Specific Match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
     SELECT * 
     FROM match_details 
     WHERE match_id = ${matchId};
    `;
  const matchQuery = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbToResponseObject(matchQuery));
});

//Get All Matches of Player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesQuery = `
     SELECT * 
     FROM match_details NATURAL JOIN
     player_match_score 
     WHERE player_id = ${playerId};`;
  const allMatchesQuery = await db.all(getAllMatchesQuery);
  response.send(
    allMatchesQuery.map((eachMatches) =>
      convertMatchDetailsDbToResponseObject(eachMatches)
    )
  );
});

//Get List of Players of a Specific Match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersQuery = `
    SELECT * 
     FROM player_details NATURAL JOIN
     player_match_score
     WHERE match_id = ${matchId};`;
  const allPlayersQuery = await db.all(getAllPlayersQuery);
  response.send(
    allPlayersQuery.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseObject(eachPlayer)
    )
  );
});

//Get the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `
   SELECT player_id as playerId, player_name as playerName, SUM(score) as totalScore, 
   SUM(fours) as totalFours, SUM(sixes) as totalSixes
    FROM player_details NATURAL JOIN 
    player_match_score 
    WHERE player_id = ${playerId};
   `;
  const stats = await db.get(playerStatsQuery);
  response.send(stats);
});

module.exports = app;
