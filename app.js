const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const intializeAndDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(`Sever is Running at http://localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}

intializeAndDbAndServer()

ConvertObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

//API 1

app.get('/states/', async (request, response) => {
  const getDetailsQuery = `
  SELECT 
  * 
  FROM 
  state
  ;`

  const stateArray = await db.all(getDetailsQuery)
  response.send(
    stateArray.map(eachState => ConvertObjectToResponseObject(eachState)),
  )
})


//API 2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateIdQuery = ` 
  SELECT 
  * 
  FROM 
  state 
  
  WHERE 
  state_id = '${stateId}';`

  const stateIdArray = await db.get(getStateIdQuery)
  response.send(ConvertObjectToResponseObject(stateIdArray))
})

//API 3

app.post('/districts/', (request, response) => {
  const districtDetails = request.body

  //Object distructuring 
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const postUpdateData = `

  INSERT INTO 

  district ( district_name , state_id , cases , cured , active , deaths )

  VALUES ("${districtName}", "${stateId}", "${cases}", "${cured}", "${active}", "${deaths}"); `

  const arrayDetails = db.run(postUpdateData)
  //console.log(arrayDetails);

  response.send('District Successfully Added')
})

DistrictDetailsArray = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}


//API 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT 
  * 
  FROM 
  district 
  
  WHERE 
  district_id = ${districtId};`

  const districtDetails = await db.get(getDistrictQuery)
  response.send(DistrictDetailsArray(districtDetails))
})

//API 5

app.delete('/districts/:districtId/', (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE FROM 
  district
  
  WHERE 
  district_id = ${districtId};`

  const deleteDetails = db.run(deleteDistrictQuery)
  //console.log(deleteDetails)
  response.send('District Removed')
})


//API 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetail = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetail

  const getUpdateQuery = `

  UPDATE

  district

  SET

  district_name = '${districtName}',
  state_id = '${stateId}',
  cases = '${cases}',
  cured = '${cured}',
  active = '${active}',
  deaths = '${deaths}'
  
  WHERE district_id = ${districtId}; `

  await db.run(getUpdateQuery)
  response.send('District Details Updated')
})


//API 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const getStatisticsQuery = `
  SELECT

  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
   
  FROM 
  district

  WHERE 
  state_id = ${stateId}`

  const stats = await db.get(getStatisticsQuery)

  //console.log(stats)

  //Accessing Propertied with Bracket Notations like stats[" "]
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

/*
OUTPUT #### Response

{
  totalCases: 724355,
  totalCured: 615324,
  totalActive: 99254,
  totalDeaths: 9777
}

*/



//API 8


app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
  SELECT 
  state_id 
  FROM 
  district

  WHERE district_id = ${districtId};
  `
  const stateIdnoQuery = await db.get(getStateNameQuery)

  const stateNameQuery = `
  SELECT 
  state_name AS stateName

  FROM 
  state

  WHERE state_id = ${stateIdnoQuery.state_id};
  `
  const getStateNameAndNo = await db.get(stateNameQuery)
  response.send(getStateNameAndNo);
})

module.exports = app
