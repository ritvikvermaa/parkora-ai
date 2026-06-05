import API from "./api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getResidentDashboard = async () => {
  const res = await fetch(`${API}/api/resident/dashboard`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  return data.data;
};

export const inviteVisitor =
async(data:any)=>{

const token=
localStorage.getItem("token");

const res=
await fetch(
`${API}/api/resident/invite-visitor`,
{

method:"POST",

headers:{

"Content-Type":"application/json",

Authorization:`Bearer ${token}`

},

body:JSON.stringify(data)

}

)

return await res.json()

}