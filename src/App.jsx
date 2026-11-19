import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, loadRemoteCourses, loadLocalCourses, saveRemoteCourses, saveLocalCourses } from './lib/data.js';
import { BookOpen, Search, Plus, MoreHorizontal, Play, Check, CheckCircle2, Clock3, Youtube, LayoutDashboard, Library, Settings, ChevronRight, ChevronDown, Pencil, Trash2, Link2, X, Menu, ArrowLeft, ListVideo, CirclePlay, Sparkles, ExternalLink, GripVertical } from 'lucide-react';

const starter = [
  { id:'c1', title:'React.js Masterclass', creator:'Code with Harry', color:'violet', videos:[
    {id:'v1',title:'React JS Tutorial for Beginners',channel:'Code with Harry',duration:'18:42',youtubeId:'Ke90Tje7VS0',done:true},
    {id:'v2',title:'React Components & Props',channel:'Code with Harry',duration:'24:16',youtubeId:'Ke90Tje7VS0',done:true},
    {id:'v3',title:'Understanding React Hooks',channel:'Code with Harry',duration:'31:08',youtubeId:'Ke90Tje7VS0',done:false},
    {id:'v4',title:'React Router: Complete Guide',channel:'Code with Harry',duration:'26:51',youtubeId:'Ke90Tje7VS0',done:false},
    {id:'v5',title:'Build and Deploy a React App',channel:'Code with Harry',duration:'42:13',youtubeId:'Ke90Tje7VS0',done:false}
  ]},
  { id:'c2', title:'UI/UX Design Fundamentals', creator:'DesignCourse', color:'orange', videos:[
    {id:'v6',title:'Design Principles You Should Know',channel:'DesignCourse',duration:'16:32',youtubeId:'ysz5S6PUM-U',done:true},
    {id:'v7',title:'Color Theory for Designers',channel:'DesignCourse',duration:'22:40',youtubeId:'ysz5S6PUM-U',done:false},
    {id:'v8',title:'Typography & Visual Hierarchy',channel:'DesignCourse',duration:'19:15',youtubeId:'ysz5S6PUM-U',done:false}
  ]},
  { id:'c3', title:'Python for Data Science', creator:'freeCodeCamp', color:'green', videos:[
    {id:'v9',title:'Python Basics',channel:'freeCodeCamp',duration:'28:10',youtubeId:'rfscVS0vtbw',done:true},
    {id:'v10',title:'NumPy Crash Course',channel:'freeCodeCamp',duration:'35:20',youtubeId:'rfscVS0vtbw',done:false},
    {id:'v11',title:'Pandas for Beginners',channel:'freeCodeCamp',duration:'41:05',youtubeId:'rfscVS0vtbw',done:false},
    {id:'v12',title:'Data Visualization with Matplotlib',channel:'freeCodeCamp',duration:'32:18',youtubeId:'rfscVS0vtbw',done:false}
  ]}
];
const read = () => {
 try {
  const stored=JSON.parse(localStorage.getItem('iknow-courses'));
  return Array.isArray(stored)?stored:starter;
 } catch { return starter; }
};
const getVideoId = url => {
 try {
  const u=new URL(url);
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  if(host==='youtu.be') return u.pathname.split('/').filter(Boolean)[0]||null;
  if(host!=='youtube.com'&&!host.endsWith('.youtube.com')) return null;
  if(u.searchParams.get('v')) return u.searchParams.get('v');
  const match=u.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/);
  return match?.[1]||null;
 } catch { return null; }
};
const initials = s => s.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
function App(){
 const [courses,setCourses]=useState(read), [active,setActive]=useState('c1'), [page,setPage]=useState('dashboard'), [query,setQuery]=useState(''), [modal,setModal]=useState(''), [courseName,setCourseName]=useState(''), [playlistUrl,setPlaylistUrl]=useState(''), [videoUrl,setVideoUrl]=useState(''), [editing,setEditing]=useState(null), [selected,setSelected]=useState(null), [toast,setToast]=useState(''), [mobile,setMobile]=useState(false), [categoryFilter,setCategoryFilter]=useState('All categories'), [sortBy,setSortBy]=useState('recent'), [undoData,setUndoData]=useState(null), [newCourseCategory,setNewCourseCategory]=useState('');
 const [importing,setImporting]=useState(false), [storageReady,setStorageReady]=useState(!API_BASE_URL), [remoteReady,setRemoteReady]=useState(false), [syncStatus,setSyncStatus]=useState(API_BASE_URL?'connecting':'local');
 const [draggedLesson,setDraggedLesson]=useState(null), [selectedVideoIds,setSelectedVideoIds]=useState([]);
 useEffect(()=>{
  if(!API_BASE_URL) return;
  let alive=true;
  loadRemoteCourses().then(remote=>{
   if(!alive)return;
   const localBackup=loadLocalCourses();
   const initialCourses=remote.length?remote:(localBackup||[]);
   setCourses(initialCourses);
   setActive(initialCourses[0]?.id||'');
   setSelected(initialCourses[0]?.videos?.find(video=>!video.done)||initialCourses[0]?.videos?.[0]||null);
   setRemoteReady(true);
   setSyncStatus('synced');
  }).catch(error=>{
   if(!alive)return;
   console.error('Could not load iKnow data from backend:',error);
   setSyncStatus('offline');
  }).finally(()=>{if(alive)setStorageReady(true)});
  return ()=>{alive=false};
 },[]);
 useEffect(()=>{
  if(!storageReady)return;
  saveLocalCourses(courses);
  if(!remoteReady)return;
  setSyncStatus('syncing');
  const timer=setTimeout(()=>{
   saveRemoteCourses(courses).then(()=>setSyncStatus('synced')).catch(error=>{
    console.error('Could not save iKnow data to backend:',error);
    setSyncStatus('offline');
   });
  },350);
  return ()=>clearTimeout(timer);
 },[courses,storageReady,remoteReady]);
 const current=courses.find(c=>c.id===active) || courses[0];
 const allVideos=courses.reduce((a,c)=>a+c.videos.length,0), done=courses.reduce((a,c)=>a+c.videos.filter(v=>v.done).length,0);
 const progressValue=c=>c.videos.length?c.videos.filter(v=>v.done).length/c.videos.length:0;
 const searchedCourses=courses.filter(c=>c.title.toLowerCase().includes(query.toLowerCase()));
 const categories=[...new Set(courses.map(c=>c.category||'Uncategorized'))].sort();
 const filtered=courses.filter(c=>c.title.toLowerCase().includes(query.toLowerCase())&&(categoryFilter==='All categories'||(c.category||'Uncategorized')===categoryFilter)).sort((a,b)=>sortBy==='name'?a.title.localeCompare(b.title):sortBy==='progress'?progressValue(b)-progressValue(a):(b.createdAt||0)-(a.createdAt||0));
 const notify=(t,keepUndo=false)=>{if(!keepUndo)setUndoData(null);setToast(t);setTimeout(()=>setToast(''),3200)};
 const updateCourse=(id,fn)=>setCourses(cs=>cs.map(c=>c.id===id?fn(c):c));
 const openCourse=c=>{setActive(c.id);setSelectedVideoIds([]);setPage('course');setSelected(c.videos.find(v=>!v.done)||c.videos[0]||null);setMobile(false)};
 const toggleDone=(courseId,videoId)=>{
  updateCourse(courseId,c=>({...c,videos:c.videos.map(v=>v.id===videoId?{...v,done:!v.done}:v)}));
  setSelected(video=>video?.id===videoId?{...video,done:!video.done}:video);
 };
 const removeVideo=(courseId,videoId)=>{const course=courses.find(c=>c.id===courseId);const index=course?.videos.findIndex(v=>v.id===videoId)??-1;const video=course?.videos[index];if(!video)return;setUndoData({courseId,items:[{video,index}]});updateCourse(courseId,c=>({...c,videos:c.videos.filter(v=>v.id!==videoId)}));if(selected?.id===videoId)setSelected(null);setSelectedVideoIds(ids=>ids.filter(id=>id!==videoId));notify('Video removed from course',true)};
 const undoRemove=()=>{if(!undoData)return;const {courseId,items}=undoData;updateCourse(courseId,c=>{const videos=[...c.videos];items.sort((a,b)=>a.index-b.index).forEach(item=>videos.splice(Math.min(item.index,videos.length),0,item.video));return {...c,videos}});setUndoData(null);notify('Removal undone')};
 const toggleVideoSelection=id=>setSelectedVideoIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
 const selectAllVideos=()=>setSelectedVideoIds(current.videos.length&&selectedVideoIds.length===current.videos.length?[]:current.videos.map(v=>v.id));
 const bulkMarkComplete=()=>{
  const ids=new Set(selectedVideoIds);
  updateCourse(active,c=>({...c,videos:c.videos.map(v=>ids.has(v.id)?{...v,done:true}:v)}));
  setSelected(video=>video&&ids.has(video.id)?{...video,done:true}:video);
  setSelectedVideoIds([]);
  notify('Selected videos marked complete');
 };
 const bulkRemoveVideos=()=>{const ids=new Set(selectedVideoIds);const course=courses.find(c=>c.id===active);const items=(course?.videos||[]).map((video,index)=>({video,index})).filter(x=>ids.has(x.video.id));setUndoData({courseId:active,items});updateCourse(active,c=>({...c,videos:c.videos.filter(v=>!ids.has(v.id))}));if(selected&&ids.has(selected.id))setSelected(null);setSelectedVideoIds([]);notify(`Removed ${ids.size} videos`,true)};
 const duplicateInCurrent=id=>current?.videos.some(v=>v.youtubeId===id);
 const reorderVideo=(courseId,draggedId,targetId)=>{
  if(!draggedId||!targetId||draggedId===targetId)return;
  updateCourse(courseId,c=>{
   const videos=[...c.videos];
   const from=videos.findIndex(v=>v.id===draggedId);
   const to=videos.findIndex(v=>v.id===targetId);
   if(from<0||to<0)return c;
   const [moved]=videos.splice(from,1);
   const insertAt=from<to?to-1:to;
   videos.splice(insertAt,0,moved);
   return {...c,videos};
  });
  setDraggedLesson(null);
  notify('Lesson order updated');
 };
 const addVideo=async()=>{
  const id=getVideoId(videoUrl);
  if(!id){notify('Enter a valid YouTube video URL');return}
  if(duplicateInCurrent(id)){notify('This video is already in this course');return}
  let details={title:'New YouTube video',channel:'Added by you',duration:'—',thumbnail:''};
  const apiKey=import.meta.env.VITE_YOUTUBE_API_KEY;
  if(apiKey){
   try{
    const endpoint=new URL('https://www.googleapis.com/youtube/v3/videos');
    endpoint.search=new URLSearchParams({part:'snippet,contentDetails',id,key:apiKey}).toString();
    const response=await fetch(endpoint);const data=await response.json();
    if(response.ok&&data.items?.[0]){
     const item=data.items[0], snippet=item.snippet||{}, iso=item.contentDetails?.duration||'';
     const match=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
     const seconds=match?(+(match[1]||0)*3600+ +(match[2]||0)*60+ +(match[3]||0)):0;
     details={title:snippet.title||details.title,channel:snippet.channelTitle||details.channel,duration:seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'—',thumbnail:snippet.thumbnails?.medium?.url||snippet.thumbnails?.default?.url||''};
    }
   }catch(error){console.warn('Could not load video details:',error)}
  }
  const v={id:'v'+Date.now(),...details,youtubeId:id,done:false};
  updateCourse(active,c=>({...c,videos:[...c.videos,v]}));
  setSelected(v);setVideoUrl('');setModal('');notify('Video added to course');
 };
 const openCreate=()=>{setCourseName('');setNewCourseCategory('');setModal('create')};
 const createCourse=()=>{if(!courseName.trim())return;const c={id:'c'+Date.now(),title:courseName.trim(),category:newCourseCategory.trim()||'Uncategorized',createdAt:Date.now(),creator:'Your course',color:['violet','orange','green','blue'][courses.length%4],videos:[]};setCourses(cs=>[...cs,c]);setActive(c.id);setSelectedVideoIds([]);setSelected(null);setCourseName('');setModal('');setPage('course');notify('Course created')};
 const importPlaylist=async()=>{
  if(!playlistUrl.trim()){notify('Paste a YouTube playlist URL');return}
  const playlistId=(()=>{try{const u=new URL(playlistUrl);return u.searchParams.get('list')}catch{return null}})();
  if(!playlistId){notify('That does not look like a YouTube playlist URL');return}
  const apiKey=import.meta.env.VITE_YOUTUBE_API_KEY;
  if(!apiKey){notify('Add your YouTube API key to the .env file first');return}
  setImporting(true);
  try{
   let items=[], pageToken='';
   do{
    const endpoint=new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    endpoint.search=new URLSearchParams({part:'snippet,contentDetails',playlistId,maxResults:'50',key:apiKey,...(pageToken?{pageToken}:{})}).toString();
    const response=await fetch(endpoint);
    const data=await response.json();
    if(!response.ok)throw new Error(data.error?.message||'YouTube playlist request failed');
    items=items.concat(data.items||[]);pageToken=data.nextPageToken||'';
   }while(pageToken);
   const seenIds=new Set();const usable=items.filter(item=>{const id=item.snippet?.resourceId?.videoId;if(!id||seenIds.has(id))return false;seenIds.add(id);return true});
   if(!usable.length)throw new Error('No videos were found in this playlist.');
   const ids=usable.map(item=>item.snippet.resourceId.videoId);
   const durationMap={};
   for(let i=0;i<ids.length;i+=50){
    const endpoint=new URL('https://www.googleapis.com/youtube/v3/videos');
    endpoint.search=new URLSearchParams({part:'contentDetails',id:ids.slice(i,i+50).join(','),key:apiKey}).toString();
    const response=await fetch(endpoint);const data=await response.json();
    if(response.ok)(data.items||[]).forEach(v=>durationMap[v.id]=v.contentDetails?.duration||'');
   }
   const videos=usable.map((item,index)=>{
    const snippet=item.snippet||{}, videoId=item.contentDetails?.videoId||snippet.resourceId.videoId;
    const iso=durationMap[videoId]||'';
    const match=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const seconds=match?(+(match[1]||0)*3600+ +(match[2]||0)*60+ +(match[3]||0)):0;
    const duration=seconds?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'—';
    return {id:'v'+Date.now()+index,title:snippet.title||'Untitled video',channel:snippet.videoOwnerChannelTitle||snippet.channelTitle||'YouTube',duration,youtubeId:videoId,done:false,thumbnail:snippet.thumbnails?.medium?.url||snippet.thumbnails?.default?.url||''};
   });
   let title='YouTube playlist';
   try{const metaUrl=new URL('https://www.googleapis.com/youtube/v3/playlists');metaUrl.search=new URLSearchParams({part:'snippet',id:playlistId,key:apiKey}).toString();const metaResponse=await fetch(metaUrl);const metaData=await metaResponse.json();if(metaResponse.ok&&metaData.items?.[0]?.snippet?.title)title=metaData.items[0].snippet.title;}catch{}
   const c={id:'c'+Date.now(),title,category:'Uncategorized',createdAt:Date.now(),creator:'Imported from YouTube',color:'blue',videos};
   setCourses(cs=>[c,...cs]);setActive(c.id);setSelectedVideoIds([]);setSelected(videos[0]||null);setPlaylistUrl('');setModal('');setPage('course');notify(`Imported ${videos.length} videos successfully`);
  }catch(error){notify(error.message||'Could not import this playlist')}
  finally{setImporting(false)}
 };
 const saveTitle=()=>{if(editing?.title.trim())updateCourse(editing.id,c=>({...c,title:editing.title.trim(),category:(editing.category||'Uncategorized').trim()||'Uncategorized'}));setEditing(null);notify('Course updated')};
 const progress=c=>c.videos.length?Math.round(c.videos.filter(v=>v.done).length/c.videos.length*100):0;
 const totalDuration=c=>c.videos.reduce((n,v)=>n+(parseInt(v.duration)||0),0);
 return <div className="app-shell">
  <aside className={`sidebar ${mobile?'show':''}`}>
   <div className="brand"><div className="brand-mark">i<span>K</span></div><span>iKnow</span><button className="mobile-close" onClick={()=>setMobile(false)}><X size={18}/></button></div>
   <div className="workspace-label">WORKSPACE</div>
   <nav><button className={page==='dashboard'?'nav active':'nav'} onClick={()=>{setPage('dashboard');setMobile(false)}}><LayoutDashboard size={18}/>Dashboard</button><button className={page==='library'?'nav active':'nav'} onClick={()=>{setPage('library');setMobile(false)}}><Library size={18}/>My courses<span className="nav-count">{courses.length}</span></button></nav>
   <div className="side-section"><div className="side-heading">YOUR LIBRARY <button onClick={openCreate}><Plus size={15}/></button></div>
    {courses.map(c=><button key={c.id} className={`course-nav ${active===c.id&&page==='course'?'selected':''}`} onClick={()=>openCourse(c)}><span className={`mini-dot ${c.color}`}></span><span>{c.title}</span></button>)}
   </div>
   <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Make learning a habit</strong><p>Small steps today. Big skills tomorrow.</p><button onClick={()=>setPage('library')}>Explore courses <ChevronRight size={14}/></button></div><button className="nav muted" onClick={()=>setModal('settings')}><Settings size={18}/>Settings</button><div className="profile"><div className="avatar">K</div><div><strong>My workspace</strong><small>Personal library</small></div><MoreHorizontal size={18}/></div></div>
  </aside>
  {mobile&&<div className="scrim" onClick={()=>setMobile(false)}></div>}
  <main className="main">
   <header className="topbar"><button className="hamburger" onClick={()=>setMobile(true)}><Menu/></button><div className="crumb">Workspace <ChevronRight size={14}/><b>{page==='dashboard'?'Dashboard':page==='library'?'My courses':current?.title||'Course'}</b></div><div className={`sync-status ${syncStatus}`} title={API_BASE_URL?`Data storage: ${syncStatus}`:"Data is saved in this browser"}><span></span>{syncStatus==='local'?'Local storage':syncStatus==='connecting'?'Connecting':syncStatus==='syncing'?'Saving':syncStatus==='synced'?'Synced':'Offline'}</div><div className="top-actions"><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search courses..."/><kbd>⌘ K</kbd></div><div className="avatar small">K</div></div></header>
   <div className={`content ${!storageReady?'is-loading':''}`}>{!storageReady&&<div className="storage-loading"><span className="loading-dot"></span> Connecting to your data storage…</div>}
    {page==='dashboard'&&<><div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"></span> YOUR LEARNING SPACE</div><h1>Keep your learning <em>in motion.</em></h1><p className="subtitle">Pick up where you left off, or make room for something new.</p></div><button className="primary" onClick={()=>setModal('import')}><Plus size={17}/> Import playlist</button></div>
     <div className="stats"><div className="stat-card"><div className="stat-top"><span>YOUR COURSES</span><div className="stat-icon purple"><BookOpen size={17}/></div></div><strong>{courses.length.toString().padStart(2,'0')}</strong><small>Learning paths in your library</small></div><div className="stat-card"><div className="stat-top"><span>TOTAL LESSONS</span><div className="stat-icon orange"><CirclePlay size={17}/></div></div><strong>{allVideos.toString().padStart(2,'0')}</strong><small>Videos ready when you are</small></div><div className="stat-card"><div className="stat-top"><span>COMPLETED</span><div className="stat-icon green"><CheckCircle2 size={17}/></div></div><strong>{done.toString().padStart(2,'0')}</strong><small>{allVideos?Math.round(done/allVideos*100):0}% of your lessons completed</small></div></div>
     <section className="section"><div className="section-head"><div><h2>Continue learning</h2><p>Every expert was once a beginner.</p></div><button className="text-button" onClick={()=>setPage('library')}>View all courses <ChevronRight size={15}/></button></div>
      <div className="course-grid">{searchedCourses.map((c,i)=><CourseCard key={c.id} course={c} progress={progress(c)} onOpen={()=>openCourse(c)} onEdit={()=>{setEditing({id:c.id,title:c.title,category:c.category||'Uncategorized'});setModal('rename')}} index={i}/>)}</div>
     </section>
     <section className="quote-banner"><div className="quote-symbol">“</div><div><strong>Consistency beats intensity.</strong><p>A little learning every day adds up to remarkable progress.</p></div><div className="quote-spark">✳</div></section>
    </>}
    {page==='library'&&<><div className="welcome-row"><div><div className="eyebrow">YOUR COLLECTION</div><h1>My <em>courses.</em></h1><p className="subtitle">Your videos, your order, your learning journey.</p></div><button className="primary" onClick={()=>setModal('import')}><Plus size={17}/> Import playlist</button></div><div className="library-toolbar"><span>{filtered.length} courses in your library</span><div className="library-controls"><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map(cat=><option key={cat}>{cat}</option>)}</select><select value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="recent">Recently added</option><option value="name">Name A–Z</option><option value="progress">Progress</option></select><button className="secondary" onClick={openCreate}><Plus size={16}/> Create course</button></div></div><div className="course-grid library-grid">{filtered.map((c,i)=><CourseCard key={c.id} course={c} progress={progress(c)} onOpen={()=>openCourse(c)} onEdit={()=>{setEditing({id:c.id,title:c.title,category:c.category||'Uncategorized'});setModal('rename')}} index={i}/>)}</div></>}
    {page==='course'&&current&&<><button className="back-link" onClick={()=>setPage('library')}><ArrowLeft size={16}/> All courses</button><div className="course-title-row"><div><div className="eyebrow">YOUR COURSE</div><h1>{current.title}</h1><p className="subtitle">{current.videos.length} lessons · {progress(current)}% completed</p></div><div className="course-actions"><button className="secondary" onClick={()=>{setEditing({id:current.id,title:current.title,category:current.category||'Uncategorized'});setModal('rename')}}><Pencil size={15}/> Edit course</button><button className="primary" onClick={()=>setModal('add')}><Plus size={16}/> Add video</button></div></div>
     <div className="learning-layout"><div className="player-column"><div className="video-frame">{selected?<iframe src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?rel=0`} title={selected.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<div className="empty-player"><Play size={34}/><strong>Choose a lesson to begin</strong><span>Your next chapter is waiting.</span></div>}</div><div className="now-playing">{selected?<><div><span className="eyebrow">NOW PLAYING</span><h2>{selected.title}</h2><p>{selected.channel} · {selected.duration}</p></div><button className={selected.done?'completed-button':'secondary'} onClick={()=>toggleDone(current.id,selected.id)}>{selected.done?<><Check size={16}/> Completed</>:<><CheckCircle2 size={16}/> Mark complete</>}</button></>:<div><h2>No video selected</h2><p>Add a video URL or select a lesson from the list.</p></div>}</div><div className="learning-tip"><Sparkles size={17}/><span><b>Learning tip</b> Take notes as you watch. Active learning helps ideas stick.</span></div></div>
      <div className="lesson-panel"><div className="lesson-head"><div><h3>Course content</h3><p>{current.videos.filter(v=>v.done).length} of {current.videos.length} completed</p></div><button className="dots-button" onClick={()=>{setEditing({id:current.id,title:current.title,category:current.category||'Uncategorized'});setModal('rename')}}><MoreHorizontal size={19}/></button></div><div className="progress-line"><span style={{width:progress(current)+'%'}}/></div><div className="bulk-toolbar"><label className="select-all"><input type="checkbox" checked={current.videos.length>0&&selectedVideoIds.length===current.videos.length} onChange={selectAllVideos}/> Select all</label>{selectedVideoIds.length>0&&<div className="bulk-actions"><span>{selectedVideoIds.length} selected</span><button onClick={bulkMarkComplete}><Check size={13}/> Complete</button><button className="bulk-delete" onClick={bulkRemoveVideos}><Trash2 size={13}/> Remove</button></div>}</div><div className="lesson-list">{current.videos.map((v,i)=><div key={v.id} className={`lesson ${selected?.id===v.id?'playing':''} ${draggedLesson===v.id?'dragging':''} ${selectedVideoIds.includes(v.id)?'selected-lesson':''}`} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',v.id);e.dataTransfer.effectAllowed='move';setDraggedLesson(v.id)}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();reorderVideo(current.id,e.dataTransfer.getData('text/plain'),v.id)}} onDragEnd={()=>setDraggedLesson(null)}><input className="lesson-select" type="checkbox" checked={selectedVideoIds.includes(v.id)} onChange={()=>toggleVideoSelection(v.id)} aria-label={`Select ${v.title}`}/><span className="drag-handle" title="Drag to reorder"><GripVertical size={15}/></span><button className="lesson-main" onClick={()=>setSelected(v)}><span className={`lesson-check ${v.done?'is-done':''}`}>{v.done?<Check size={13}/>:<Play size={12}/>}</span><span className="lesson-copy"><b>{String(i+1).padStart(2,'0')} · {v.title}</b><small>{v.duration}</small></span></button><button className="remove-lesson" title="Remove video" onClick={()=>removeVideo(current.id,v.id)}><Trash2 size={14}/></button></div>)}</div><button className="add-lesson" onClick={()=>setModal('add')}><Plus size={16}/> Add a video</button></div></div>
    </>}
   </div>
  </main>
  {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal('')}}><div className="modal"><button className="modal-close" onClick={()=>setModal('')}><X size={18}/></button><div className="modal-icon">{modal==='import'?<Youtube/>:modal==='add'?<Link2/>:modal==='settings'?<Settings/>:<BookOpen/>}</div>
   {modal==='settings'&&<><div className="eyebrow">WORKSPACE SETTINGS</div><h2>Storage & integrations</h2><p>Check where your learning data is saved and which integrations are configured.</p><div className="settings-list"><div className="settings-row"><span>Data storage</span><strong>{API_BASE_URL?'Backend API':'This browser'}</strong></div><div className="settings-row"><span>Connection</span><strong className={`settings-status ${syncStatus}`}>{syncStatus==='local'?'Local only':syncStatus==='connecting'?'Connecting':syncStatus==='syncing'?'Saving':syncStatus==='synced'?'Connected':'Offline'}</strong></div><div className="settings-row"><span>YouTube Data API</span><strong>{import.meta.env.VITE_YOUTUBE_API_KEY?'Configured':'Not configured'}</strong></div><div className="settings-row"><span>Courses in library</span><strong>{courses.length}</strong></div><div className="settings-row"><span>Lessons in library</span><strong>{allVideos}</strong></div></div><div className="helper">Backend connection is configured through VITE_API_BASE_URL in your local .env file. YouTube integration uses VITE_YOUTUBE_API_KEY.</div></>}
   {modal==='import'&&<><div className="eyebrow">BRING YOUR LEARNING TOGETHER</div><h2>Import a playlist</h2><p>Paste a YouTube playlist link to turn it into a course in your library.</p><label>YouTube playlist URL</label><input className="modal-input" value={playlistUrl} onChange={e=>setPlaylistUrl(e.target.value)} placeholder="https://www.youtube.com/playlist?list=..."/><div className="helper">You can also add individual videos to a course at any time.</div><button className="primary full" onClick={importPlaylist} disabled={importing}>{importing?"Importing playlist…":"Import playlist"} <ChevronRight size={16}/></button><div className="api-note">Playlist importing uses your locally configured YouTube Data API key. Keep this prototype key restricted and never commit it to a public repository.</div></>}
   {modal==='add'&&<><div className="eyebrow">GROW YOUR COURSE</div><h2>Add a video</h2><p>Paste a YouTube share link. We'll add it to <b>{current?.title}</b>.</p><label>YouTube video URL</label><input className="modal-input" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://youtu.be/..."/><div className="helper">Supported: youtube.com/watch, youtu.be and YouTube embed links.</div><button className="primary full" onClick={addVideo}>Add to course <Plus size={16}/></button></>}
   {modal==='create'&&<><div className="eyebrow">START SOMETHING NEW</div><h2>Create a course</h2><p>Give your learning path a name. You can add videos whenever you're ready.</p><label>Course name</label><input className="modal-input" value={courseName} onChange={e=>setCourseName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createCourse()} placeholder="e.g. JavaScript from zero to hero"/><label className="category-label">Category</label><input className="modal-input" value={newCourseCategory} onChange={e=>setNewCourseCategory(e.target.value)} placeholder="e.g. Programming, Design, Data Science"/><button className="primary full" onClick={createCourse}>Create course <Plus size={16}/></button></>}
   {modal==='rename'&&<><div className="eyebrow">MAKE IT YOURS</div><h2>Edit course</h2><p>Update the name of this learning path.</p><label>Course name</label><input className="modal-input" value={editing?.title||''} onChange={e=>setEditing({...editing,title:e.target.value})} onKeyDown={e=>e.key==='Enter'&&saveTitle()}/><label className="category-label">Category</label><input className="modal-input" value={editing?.category||''} onChange={e=>setEditing({...editing,category:e.target.value})} placeholder="e.g. Programming, Design, Data Science"/><button className="primary full" onClick={saveTitle}>Save changes</button><button className="danger-link" onClick={()=>{setCourses(cs=>cs.filter(c=>c.id!==editing.id));setActive(courses.find(c=>c.id!==editing.id)?.id||'');setSelected(null);setPage('library');setModal('');notify('Course deleted')}}><Trash2 size={14}/> Delete this course</button></>}
  </div></div>}
  {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}{undoData&&<button className="undo-button" onClick={undoRemove}>Undo</button>}</div>}
 </div>;
}
function CourseCard({course,progress,onOpen,onEdit,index}){
 const themes={violet:'art-violet',orange:'art-orange',green:'art-green',blue:'art-blue'};
 const thumbnail=course.videos.find(v=>v.thumbnail)?.thumbnail;
 return <article className="course-card">
  <button className={`course-art ${themes[course.color]||'art-blue'} ${thumbnail?'has-thumb':''}`} onClick={onOpen}>
   {thumbnail?<img className="course-thumb" src={thumbnail} alt="" loading="lazy"/>:<><span className="art-orbit"></span><span className="art-icon">{course.color==='orange'?'◈':course.color==='green'?'⌘':course.color==='blue'?'✳':'⌁'}</span></>}
   <span className="art-shade"></span><span className="art-number">0{index+1}</span><span className="art-label">iKnow / LEARNING PATH</span><span className="art-play"><Play size={16} fill="currentColor"/></span>
  </button>
  <div className="course-info"><div className="course-meta"><span>{course.videos.length} LESSONS</span><button className="dots-button" onClick={onEdit}><MoreHorizontal size={18}/></button></div><button className="course-name" onClick={onOpen}>{course.title}</button><p>{course.creator}</p><span className="course-category">{course.category||'Uncategorized'}</span><div className="card-progress"><div className="progress-line"><span style={{width:progress+'%'}}/></div><div className="progress-label"><span>{progress}% complete</span><span>{course.videos.filter(v=>v.done).length}/{course.videos.length}</span></div></div></div>
 </article>;
}
export default App;
