export interface TeamMember { id:string; name:string; role:string; bio:string; photoUrl:string; isPlaceholder:boolean; }
export const team: TeamMember[] = [
  ['Tanzil Ahmed', 'AI Director'], ['Naimul Azad', 'Creative Director'],
  ['Abdur Rob Rimon', 'Associate Creative Director'], ['Umme Kulsum', 'Project Manager'],
  ['Faisal Mahmud', 'AI Artist'], ['Sumaia Ahsan', 'AI Artist'],
  ['Farzana Ahad', 'AI Artist'], ['Shahinur Rahman', 'AI Artist'],
].map(([name, role], i) => ({ id: `team-${i+1}`, name: name ?? '', role: role ?? '', bio: '', photoUrl: '', isPlaceholder: false }));
export function teamInitials(name: string) { return name.split(/\s+/).map(word => word[0] ?? '').join(''); }
