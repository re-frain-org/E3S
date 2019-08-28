(function(){
	"use strict";
	/**
	 * UIを構成する要素を取得する
	 */
	const inputNonActiveFile=document.querySelector("#inputNonActiveFile");
	const inputNonWorkile=document.querySelector("#inputNonWorkFile");
	const inputStart=document.querySelector("#inputStart");
	const inputFinish=document.querySelector("#inputFinish");
	const inputSpan=document.querySelector("#inputSpan");
	const inputNoActive=document.querySelector("#inputNoActive");
	const inputNoWork=document.querySelector("#inputNoWork");
	const inputRun=document.querySelector("#inputRun");
	const inputYear=document.querySelector("#inputYear");
	const inputMonth=document.querySelector("#inputMonth");
	const inputDate=document.querySelector("#inputDate");
	const inputHour=document.querySelector("#inputHour");
	const inputMinute=document.querySelector("#inputMinute");
	const resultTable=document.querySelector("#resultTable");
	/**
	 * プログラム内で使用するグローバル変数の宣言
	 * ※NO_WORKINGは取り出しの対応ができない(環境槽が動いている)日付のリスト
	 * ※NO_WORKINGは規定のフォーマット(YYYY/MM/DD)で入力
	 * ※NO_ACTIVEは試験ができない(環境槽が動いていない)期間のリスト
	 * ※NO_ACTIVEは規定のフォーマット(YYYY/MM/DD hh:mm~YYYY/MM/DD hh:mm_REASON)で入力
	 */
	let start,finish,span,total,loop,distance;
	let base,temp;
	const cache=[],NO_WORK=[],NO_ACTIVE=[];
	/**
	 * @param  {Number} value
	 * @return {Number}
	 * ミリ秒を時間に変換する
	 * value / (min x sec x ms)
	 */
	function parse(value){
		return Math.floor(value/3600000);
	}
	/**
	 * 年月日時分を保存する
	 */
	function save(){
		cache.push(temp.getFullYear());
		cache.push(temp.getMonth()+1);
		cache.push(temp.getDate());
		cache.push(temp.getHours());
		cache.push(temp.getMinutes());
	}
	/**
	 * @param  {Date}   value[=temp]
	 * @return {String}
	 * Dateオブジェクトを規定のフォーマット(YYYY/MM/DD hh:mm)に変換する
	 */
	function convert(value=temp){
		const month=value.getMonth()+1;
		const date=value.getDate();
		const hours=value.getHours();
		const minutes=value.getMinutes();
		return `${value.getFullYear()}/${month<10?`0${month}`:month}/${date<10?`0${date}`:date} ${hours<10?`0${hours}`:hours}:${minutes<10?`0${minutes}`:mintes}`;
	}
	/**
	 * @param  {Number} value
	 * 指定の時間に変更する
	 * 遅いなら次の日にする
	 */
	function setup(value){
		if(temp.getHours()>value)
			temp.setDate(temp.getDate()+1);
		temp.setHours(value);
	}
	/**
	 * データをテーブルに出力する
	 */
	function output(){
		const tr=document.createElement("tr");
		cache.forEach(function(value){
			const td=document.createElement("td");
			td.textContent=value;
			tr.appendChild(td);
		});
		resultTable.appendChild(tr);
	}
	/**
	 * @return {Boolean}
	 * 取り出し不可能な日(平日)かを判定する
	 */
	function isHoliday(){
		return NO_WORK.includes(`${temp.getFullYear()}/${temp.getMonth()+1}/${temp.getDate()}`);
	}
	/**
	 * @return {Boolean}
	 * 取り出し不可能な日(休日)かを判定する
	 */
	function isWeekend(){
		return temp.getDay()%6==0;
	}
	/**
	 * @return {Boolean}
	 * 非稼働日かを判定する
	 * その場合、一度データを出力しループを再開させる
	 */
	function test(){
		//検出用のフラグ
		let flag=false;
		//非稼働日を全数検査
		NO_ACTIVE.forEach(function(value){
			//アンダーバーでデータを区切る(=期間と理由を分ける)
			let [period,reason]=value.split("_");
			//チルダでデータを区切る(=中断と再開を分ける)
			const [stop,restart]=period.split("~");
			//中断の日か検査する
			if(convert().split(" ")[0]==stop.split(" ")[0]){
				//年月日時分を設定し、1日戻す
				temp=new Date(stop);
				temp.setDate(temp.getDate()-1);
				//データを保存する
				save();
				//経過時間の再計算
				total=parse(temp.getTime()-base)-7*loop-distance+start;
				//非稼働時間の再計算
				const stopDate=new Date(stop);
				stopDate.setDate(stopDate.getDate()-2);
				const restartDate=new Date(restart);
				restartDate.setDate(restartDate.getDate());
				distance+=parse(restartDate.getTime()-stopDate.getTime());
				//年月日時分を設定し、1日進める
				temp=new Date(restart);
				temp.setDate(temp.getDate()+1);
				//フラグを反転する
				flag=true;
				//データを保存する
				cache.push(total);
				cache.push(reason);
				//データを出力する
				output();
				//データを削除する
				cache.length=0;
			}
		});
		//検出結果を返す
		return flag;
	}
	/**
	 * メインプログラム
	 */
	function main(){
		//データを保存する
		save();
		//中断時間を設定する
		setup(10);
		//サイクル時間xサイクル数以下の間ループする
		while(parse(temp.getTime()-base)<span*(loop+1)+7*loop+distance-start){
			//翌日に変更
			temp.setDate(temp.getDate()+1);
			//非稼働日に差し掛かったらループを中断する
			if(test())
				return true;
		}
		//取り出し不可能な日の間ループする
		while(isWeekend()||isHoliday())
			//翌日に変更
			temp.setDate(temp.getDate()+1);
		//経過時間の再計算
		total=parse(temp.getTime()-base)-7*loop-distance+start;
		//データを保存する
		save();
		cache.push(total);
		cache.push("");
		//データを出力する
		output();
		//データを削除する
		cache.length=0;
		//ループ回数の変更
		loop++;
		//再開時間を設定する
		setup(17);
		//終了時間以上でfalseを返す=親ループの終了
		return total<finish;
	}
	/**
	 * グローバル変数の初期化とテーブルの1行目の出力
	 */
	function reset(){
		//グローバル変数を初期化する
		start=parseInt(inputStart.value);
		finish=parseInt(inputFinish.value);
		span=parseInt(inputSpan.value);
		total=0;
		loop=Math.floor(start/span);
		distance=0;
		temp=new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
		base=temp.getTime();
		cache.length=0;
		//テーブルを空にする
		resultTable.innerHTML="";
		//テーブルの1行目を出力する
		const tr=document.createElement("tr");
		["年","月","日","時","分","年","月","日","時","分","経過","停止理由"].forEach(function(value){
			const th=document.createElement("th");
			th.textContent=value;
			tr.appendChild(th);
		});
		resultTable.appendChild(tr);
	}
	/**
	 * @param  {File}     file[=temp]
	 * @param  {Function} succeed[=function(event){}]
	 * ファイルを読み込み、処理を実行する
	 */
	function readFile(file,succeed=function(event){}){
		//File APIのFileReaderオブジェクトのインスタンスを作成
		const reader=new FileReader();
		//loadイベント時の処理を設定
		reader.addEventListener("load",succeed,false);
		//対象ファイルを文字列として読み込む
		reader.readAsText(file);
	}
	//changeイベント時の処理を設定
	inputNoActiveFile.addEventListener("change",function(event){
		//選択されたファイルを読み込む
		readFile(event.target.files[0],function(event){
			//取り出し不可能な日のリストを初期化する
			NO_ACTIVE.length=0;
			//読み込み結果を取得し、改行シーケンスを置き換える
			const result=event.target.result.replace(/\r/g,"");
			//データを改行シーケンスで区切り、取り出し不可能な日のリストにデータを格納する
			result.split("\n").forEach(function(value){
				NO_ACTIVE.push(value);
			});
		});
	},false);
	//changeイベント時の処理を設定
	inputNoWorkFile.addEventListener("change",function(event){
		//選択されたファイルを読み込む
		readFile(event.target.files[0],function(event){
			//取り出し不可能な日のリストを初期化する
			NO_WORKING.length=0;
			//読み込み結果を取得し、改行シーケンスを置き換える
			const result=event.target.result.replace(/\r/g,"");
			//データを改行シーケンスで区切り、取り出し不可能な日のリストにデータを格納する
			result.split("\n").forEach(function(value){
				NO_WORK.push(value);
			});
		});
	},false);
	//clickイベント時の処理を設定
	inputNonActive.addEventListener("click",function(event){
		//要素をクリックする
		inputNoActiveFile.click();
	},false);
	//clickイベント時の処理を設定
	inputNonWork.addEventListener("click",function(event){
		//要素をクリックする
		inputNoWorkFile.click();
	},false);
	//clickイベント時の処理を設定
	inputRun.addEventListener("click",function(event){
		//グローバル変数を初期化する
		reset();
		//メインプログラムの実行
		while(main());
	},false);
})();