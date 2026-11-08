import { describe,it,expect } from 'vitest';
import {filterBoardJobs,clearBoardSearch,boardSearchSchema} from './career-board-rules';
const intern={title:'AI Video Artist Intern',summary:'Learn filmmaking',type:'internship',work_mode:'hybrid',experience_level:'none',schedule:'evening',created_at:'2026-11-08'};
const senior={title:'Editor',summary:'Remote editing',type:'full_time',work_mode:'remote',experience_level:'senior',schedule:'day',created_at:'2026-11-09'};
describe('Careers board filters',()=>{
  it('search matches role or summary case insensitively',()=>{expect(filterBoardJobs([intern,senior],{...clearBoardSearch,q:'FILMMAKING'})).toEqual([intern]);expect(filterBoardJobs([intern],{...clearBoardSearch,q:'sound'})).toEqual([])});
  it('multiple types are OR within a group',()=>{expect(filterBoardJobs([intern,senior],{...clearBoardSearch,types:['internship','full_time']})).toHaveLength(2);expect(filterBoardJobs([intern,senior],{...clearBoardSearch,types:['freelance']})).toEqual([])});
  it('work modes combine with type by AND',()=>{expect(filterBoardJobs([intern,senior],{...clearBoardSearch,types:['internship'],modes:['remote']})).toEqual([]);expect(filterBoardJobs([intern],{...clearBoardSearch,modes:['hybrid']})).toEqual([intern])});
  it('no experience matches none only',()=>{expect(filterBoardJobs([intern,senior],{...clearBoardSearch,experience:['none']})).toEqual([intern])});
  it('evening matches internship schedule',()=>{expect(filterBoardJobs([intern,senior],{...clearBoardSearch,schedules:['evening']})).toEqual([intern])});
  it('latest and oldest sort by posted date',()=>{expect(filterBoardJobs([intern,senior],clearBoardSearch)[0]).toEqual(senior);expect(filterBoardJobs([intern,senior],{...clearBoardSearch,sort:'oldest'})[0]).toEqual(intern)});
  it('URL arrays roundtrip all groups without discarding unknown values',()=>{const search={...clearBoardSearch,types:['part_time'],modes:['hybrid'],experience:['none'],schedules:['evening']};expect(boardSearchSchema.parse(JSON.parse(JSON.stringify(search)))).toEqual(search)});
});