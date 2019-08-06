(function(){
	//厳格なスクリプトを要求する
	"use strict";
	//画面上の要素を取得する
	const inputFile=document.querySelector("#inputFile");
	const inputStart=document.querySelector("#inputStart");
	const inputLimit=document.querySelector("#inputLimit");
	const inputSpan=document.querySelector("#inputSpan");
	const inputOpen=document.querySelector("#inputOpen");
	const inputRun=document.querySelector("#inputRun");
	const inputYear=document.querySelector("#inputYear");
	const inputMonth=document.querySelector("#inputMonth");
	const inputDate=document.querySelector("#inputDate");
	const inputHour=document.querySelector("#inputHour");
	const inputMinute=document.querySelector("#inputMinute");
	const resultTable=document.querySelector("#resultTable");
	const logDiv=document.querySelector("#logDiv");
	//プログラム内で使われる変数
	const cache=[],holidays=[];
	let base,sub,start,limit,span,total,loop,message;
	function isHoliday(){
		//休日を検出する
		if(holidays.includes(`${sub.getFullYear()}/${sub.getMonth()+1}/${sub.getDate()}`)){
			//ログを更新する
			message+=`

Holiday	: ${convert()}hr
Before	: ${parse()}`;
			return true;
		}
		return false;
	}
	function isWeekend(){
		//土日を検出する
		if(sub.getDay()%6==0){
			//ログを更新する
			message+=`

Weekend	: ${convert()}hr
Before	: ${parse()}`;
			return true;
		}
		return false;
	}
	function convert(){
		//ミリ秒から時間を取得する
		return Math.floor((sub-base)/3600000)-7*loop;
	}
	function output(){
		//要素を生成
		const tr=document.createElement("tr");
		//データをループする
		cache.forEach(function(value){
			//要素を生成
			const td=document.createElement("td");
			//テキストを設定
			td.textContent=value;
			//親ノードに格納
			tr.appendChild(td);
		});
		//親ノードに格納
		resultTable.appendChild(tr);
		//データの初期化
		cache.length=0;
	}
	function parse(){
		//既定のフォーマット(YYYY/MM/DD (d) hh:mm)に変換する
		const month=sub.getMonth()+1;
		const date=sub.getDate();
		const hours=sub.getHours();
		const minutes=sub.getMinutes();
		return `${sub.getFullYear()}/${month<10?`0${month}`:month}/${date<10?`0${date}`:date} (${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][sub.getDay()]}) ${hours<10?`0${hours}`:hours}:${minutes<10?`0${minutes}`:mintes}`;
	}
	function save(){
		//データを保存する
		cache.push(sub.getFullYear());
		cache.push(sub.getMonth()+1);
		cache.push(sub.getDate());
		cache.push(sub.getHours());
		cache.push(sub.getMinutes());
	}
	function setup(value){
		//設定時刻よりも後の場合は翌日に設定する
		if(sub.getHours()>value)
			sub.setDate(sub.getDate()+1);
		//時間を設定する
		sub.setHours(value);
	}
	function main(){
		//span時間分加算する
		sub.setHours(sub.getHours()+span-total%span);
		//時刻修正する
		setup(10);
		//土日・休日を検出する
		while(isWeekend()||isHoliday()){
			//翌日に設定する
			sub.setDate(sub.getDate()+1);
			//ログを更新する
			message+=`
After	: ${parse()}`;
		}
		//経過時間を再計算する
		total=convert();
		//ログを更新する
		message+=`

Stop	: ${parse()}

Total	: ${total+start}hr
================================`;
		//データを保存する
		save();
		//データを保存する
		cache.push(total+start);
		//データを出力する
		output();
		//実行回数の再計算
		loop++;
		//上限を超えた場合は終了する
		if(total>=limit)return false;
		//時刻を修正する
		setup(17);
		//データを保存する
		save();
		//ログを更新する
		message+=`
Start	: ${parse()}`;
		return true;
	}
	//changeイベント実行時(=ファイル選択時)に実行する
	inputFile.addEventListener("change",function(event){
		//File APIのFileReaderオブジェクト
		const reader=new FileReader();
		//loadイベント実行時(=読み込み完了時)に実行する
		reader.addEventListener("load",function(event){
			//データを初期化する
			holidays.length=0;
			//Windowsの改行シーケンスを処理し、改行シーケンス区切りでループする
			event.target.result.replace(/\r/g,"").split("\n").forEach(function(value){
				//データを保存する
				holidays.push(value);
			});
		},false);
		//選択したファイルをテキストとして読み込む
		reader.readAsText(event.target.files[0]);
	},false);
	//clickイベント実行時(=クリック時)に実行する
	inputOpen.addEventListener("click",function(event){
		//要素をクリックする
		inputFile.click();
	},false);
	//clickイベント実行時(=クリック時)に実行する
	inputRun.addEventListener("click",function(event){
		//データを初期化する
		cache.length=0;
		base=new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
		sub=new Date(base.getTime());
		start=parseInt(inputStart.value);
		limit=parseInt(inputLimit.value)-start;
		span=parseInt(inputSpan.value);
		total=0;
		loop=0;
		//データを保存する
		save();
		//ログを更新する
		message=`================================
Start	: ${parse()}`;
		//テーブルを空にする
		resultTable.innerHTML="";
		//メインのプログラム
		while(main());
		//ログを出力する
		logDiv.textContent=message;
	},false);
})();
