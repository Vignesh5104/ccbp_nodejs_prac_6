const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server...')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initDbAndServer()

const convertStateToRes = obj => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  }
}

const convertDisToRes = obj => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getAllStatesQuery = `
        SELECT *
        FROM
          state
        ORDER BY 
          state_id;
    `

  const allStates = await db.all(getAllStatesQuery)
  response.send(
    allStates.map(each => {
      return convertStateToRes(each)
    }),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT * FROM
  state
  WHERE 
  state_id=${stateId};`

  const oneState = await db.get(getStateQuery)
  response.send(convertStateToRes(oneState))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQuery = `
  INSERT INTO district(
    district_name,
    state_id,
    cases,
    cured,
    active,
    deaths
  ) VALUES(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`

  await db.run(postQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT * FROM
  district
  WHERE
    district_id=${districtId};`

  const oneDistrict = await db.get(getDistrictQuery)
  response.send(convertDisToRes(oneDistrict))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id=${districtId};`

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const putDistrictQuery = `
  UPDATE district
  SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
  WHERE
    district_id=${districtId};
    `

  await db.run(putDistrictQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
  SELECT
    SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
  FROM
    district
  WHERE
    state_id = ${stateId};
    `

  const oneStateStats = await db.get(getStatsQuery)
  response.send(oneStateStats)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
  SELECT 
    state_name AS stateName
  FROM state INNER JOIN district ON
    state.state_id=district.state_id
  WHERE
    district_id=${districtId};
    `

  const stateName = await db.get(getStateNameQuery)
  response.send(stateName)
})

module.exports = app
