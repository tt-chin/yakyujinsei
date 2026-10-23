import {releaseNotes} from '../data/release-notes.js';
export function initializeInformationDialogs(){
  const entries={
    help:{title:'遊び方',sections:[
      ['はじめに','選手名・ポジション・ワールドシードを選び、野球人生を始めます。同じSeedでも選択やバージョンによって結果は変わります。'],
      ['育成と選択','画面下の選択肢で進めます。育成では現在値と潜在能力、必要なポイントを確認して配分してください。潜在能力を超える成長には多くのポイントが必要です。'],
      ['選手とキャリア','「選手」で能力・コンディション・特性、「キャリア」で成績・実績・契約・年度別記録を確認できます。'],
      ['共有と表示設定','右上のメニューからSeed共有と表示設定を開けます。共有URLは途中の保存データではなく、そのSeedで新しい人生を始めるためのものです。'],
      ['再開について','このページを閉じたり再読み込みすると進行中の人生は失われます。「最初からやり直す」は確認後に新しく始めます。']]},
    updates:{title:'更新履歴',sections:releaseNotes.map(r=>[r.title,r.lines.join('\n')])}
  };
  for(const [key,entry] of Object.entries(entries)){
    const dialog=document.createElement('dialog');dialog.id='information-'+key;dialog.className='information-dialog';
    dialog.setAttribute('aria-labelledby',dialog.id+'-title');
    const heading=document.createElement('h2');heading.id=dialog.id+'-title';heading.tabIndex=-1;heading.textContent=entry.title;dialog.append(heading);
    for(const [title,body] of entry.sections){const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=body;section.append(h,p);dialog.append(section);}
    const close=document.createElement('button');close.type='button';close.textContent='閉じる';dialog.append(close);document.body.append(dialog);
    let opener=null,position=null;
    const restore=()=>{const target=opener,scroll=position;opener=null;position=null;target?.focus({preventScroll:true});if(scroll)window.scrollTo(...scroll);};
    const dismiss=()=>{dialog.close();restore();};
    close.addEventListener('click',dismiss);
    dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();});
    dialog.addEventListener('close',()=>{if(!dialog.open)restore();});
    document.querySelectorAll('[data-information="'+key+'"]').forEach(button=>button.addEventListener('click',()=>{if(dialog.open)return;opener=button.closest('#board-menu')?document.getElementById('board-menu-toggle'):button;position=[window.scrollX,window.scrollY];dialog.showModal();heading.focus({preventScroll:true});}));
  }
}
