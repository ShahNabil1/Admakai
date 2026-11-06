import { expect, it } from 'vitest';
import { team, teamInitials } from './team';
const approved = [
  ['Tanzil Ahmed','AI Director'],['Naimul Azad','Creative Director'],
  ['Abdur Rob Rimon','Associate Creative Director'],['Umme Kulsum','Project Manager'],
  ['Faisal Mahmud','AI Artist'],['Sumaia Ahsan','AI Artist'],
  ['Farzana Ahad','AI Artist'],['Shahinur Rahman','AI Artist'],
];
it('preserves the supplied team identities and order',()=>expect(team.map(member=>[member.name,member.role])).toEqual(approved));
it('does not invent bios or photos',()=>expect(team.map(member=>[member.bio,member.photoUrl])).toEqual(Array.from({length:8},()=>['',''])));
it('uses initials for the supplied team',()=>expect(team.map(member=>teamInitials(member.name))).toEqual(['TA','NA','ARR','UK','FM','SA','FA','SR']));