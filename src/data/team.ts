export interface TeamMember { id:string; name:string; role:string; bio:string; photoUrl:string; isPlaceholder:boolean; }
export const team: TeamMember[] = ['Creative direction','AI production','Editing and motion','Client partnership'].map((role,i)=>({id:`team-${i+1}`,name:'Team member',role,bio:'Meet the people behind the work. Profile to be added.',photoUrl:'',isPlaceholder:true}));
