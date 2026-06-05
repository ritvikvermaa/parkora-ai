import API from "./api";

export const getViolations = async () => {
  const res = await fetch(`${API}/api/ai/violations`);
  return await res.json();
};

export const getRecommendation = async (tower:string,floor:string) => {

  const res = await fetch(
    `${API}/api/ai/recommend-slot`,
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        tower,
        floor
      })
    }
  )

  return await res.json()

}

export const getSlots = async()=>{

const res = await fetch(
`${API}/api/slots`
)

return await res.json()

}

export const getVehicles = async()=>{

const res = await fetch(
`${API}/api/vehicles/active`
)

return await res.json()

}

export const getVisitors = async()=>{

const res = await fetch(
`${API}/api/visitors`
)

return await res.json()

}