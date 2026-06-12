import API from "./api";
import { getAuthHeaders } from "./authHeaders";

export const getViolations = async () => {
  const res = await fetch(`${API}/api/ai/violations`);
  return await res.json();
};

export const getAiDashboard = async () => {
  const res = await fetch(`${API}/api/ai/dashboard`);
  return await res.json();
};

export const getRecommendation = async (tower:string,floor:string) => {

  const res = await fetch(
    `${API}/api/ai/recommend-slot`,
    {
      method:"POST",

      headers: getAuthHeaders(),

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
`${API}/api/slots`,
{ headers: getAuthHeaders() }
)

return await res.json()

}

export const getVehicles = async()=>{

const res = await fetch(
`${API}/api/vehicles/active`,
{ headers: getAuthHeaders() }
)

return await res.json()

}

export const getVisitors = async()=>{

const res = await fetch(
`${API}/api/visitors`,
{ headers: getAuthHeaders() }
)

return await res.json()

}
