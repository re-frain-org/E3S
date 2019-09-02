(function(){
	"use strict";
	/**
	 * UIを構成する要素を取得する
	 */
	const pickImmobileList=document.querySelector("#pickImmobileList");
	const pickHolidayList=document.querySelector("#pickHolidayList");
	const inputStart=document.querySelector("#inputStart");
	const inputFinish=document.querySelector("#inputFinish");
	const inputSpan=document.querySelector("#inputSpan");
	const clickImmobileListPicker=document.querySelector("#clickImmobileListPicker");
	const clickHolidayListPicker=document.querySelector("#clickHolidayListPicker");
	const inputYear=document.querySelector("#inputYear");
	const inputMonth=document.querySelector("#inputMonth");
	const inputDate=document.querySelector("#inputDate");
	const inputHour=document.querySelector("#inputHour");
	const inputMinute=document.querySelector("#inputMinute");
	const runButton=document.querySelector("#runButton");
	const copyButton=document.querySelector("#copyButton");
	const resultTable=document.querySelector("#resultTable");
	/**
	 * プログラム内で使用するグローバル変数を宣言する
	 * ※IMMOBILE_LISTは試験ができない(環境槽が動いていない)期間のリスト
	 * ※IMMOBILE_LISTは規定のフォーマット(YYYY/MM/DD hh:mm~YYYY/MM/DD hh:mm_REASON)で入力する
	 * ※HOLIDAY_LISTは取り出しの対応ができない(環境槽が動いている)日付のリスト
	 * ※HOLIDAY_LISTは規定のフォーマット(YYYY/MM/DD)で入力する
	 */
	const cache=[],IMMOBILE_LIST=[],HOLIDAY_LIST=[];
	let base,distance,finish,loop,span,start,temp,total;
	/**
	 * 各イベント時の処理を設定
	 */
	pickImmobileList.addEventListener("change",onChange,false);
	pickHolidayList.addEventListener("change",onChange,false);
	clickImmobileListPicker.addEventListener("click",onClick,false);
	clickHolidayListPicker.addEventListener("click",onClick,false);
	runButton.addEventListener("click",onClick,false);
	copyButton.addEventListener("click",onClick,false);
	/**
	 * @param {Event} event
	 * changeイベントの処理
	 */
	function onChange(event){
		switch(event.target){
			case pickImmobileList:
				read(event.target.files[0],function(event){
					IMMOBILE_LIST.length=0;
					const result=event.target.result.replace(/\r/g,"");
					result.split("\n").forEach(currentValue=>IMMOBILE_LIST.push(currentValue));
				},function(event){
					console.error("Failed to read file.");
				});
				break;
			case pickHolidayList:
				read(event.target.files[0],function(event){
					HOLIDAY_LIST.length=0;
					const result=event.target.result.replace(/\r/g,"");
					result.split("\n").forEach(currentValue=>HOLIDAY_LIST.push(currentValue));
				},function(event){
					console.error("Failed to read file.");
				});
				break;
		}
	}
	/**
	 * @param {Event} event
	 * clickイベントの処理
	 */
	function onClick(event){
		switch(event.target){
			case clickImmobileListPicker:
				pickImmobileList.click();
				break;
			case clickHolidayListPicker:
				pickHolidayList.click();
				break;
			case runButton:
				reset();
				while(main());
				break;
			case copyButton:
				copy(resultTable);
				break;
		}
	}
	/**
	 * @param  {File}     file
	 * @param  {Function} succeed
	 * @param  {Function} failed
	 * ファイルを読み込み、成功時・失敗時それぞれの処理を実行する
	 */
	function read(file,succeed,failed){
		const reader=new FileReader();
		reader.addEventListener("error",failed,false);
		reader.addEventListener("load",succeed,false);
		reader.readAsText(file);
	}
	/**
	 * 変数とテーブルの1行目の初期化
	 */
	function reset(){
		start=parseInt(inputStart.value);
		finish=parseInt(inputFinish.value);
		span=parseInt(inputSpan.value);
		total=0;
		loop=Math.floor(start/span);
		distance=0;
		temp=new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
		base=temp.getTime();
		cache.length=0;
		resultTable.innerHTML="";
		output(["年","月","日","時","分","年","月","日","時","分","経過","停止理由"]);
	}
	/**
	 * 日時の演算や出力等を行うメインのプログラム
	 */
	function main(){
		save(temp);
		update(10);
		while(parse(temp.getTime()-base)<span*(loop+1)+7*loop+distance-start){
			temp.setDate(temp.getDate()+1);
			if(search())
				return true;
		}
		while(check(temp))
			temp.setDate(temp.getDate()+1);
		total=parse(temp.getTime()-base)-7*loop-distance+start;
		save(temp);
		output(cache.concat([total,""]));
		cache.length=0;
		loop++;
		update(17);
		return total<finish;
	}
	/**
	 * @param  {Number} hour
	 * 現在の時刻がhour以前ならhourに設定し、
	 * そうでないなら翌日に変更した上でhourに設定する
	 */
	function update(hour){
		if(temp.getHours()>hour)
			temp.setDate(temp.getDate()+1);
		temp.setHours(hour);
	}
	/**
	 * @param  {Number} millisecond
	 * @return {Number}
	 * ミリ秒を時間に変換する(変換式: millisecond/(min*sec*ms))
	 */
	function parse(millisecond){
		return Math.floor(millisecond/3600000);
	}
	/**
	 * @return {Boolean}
	 * 非稼働日の場合、データを出力した後にtrueを返す
	 */
	function search(){
		let flag=false;
		IMMOBILE_LIST.forEach(function(currentValue,index,array){
			const [period,reason]=currentValue.split("_");
			const [stop,restart]=period.split("~");
			if(convert(temp).split(" ")[0]==stop.split(" ")[0]){
				const stopDate=new Date(stop);
				save(stopDate);
				total=parse(stopDate.getTime()-base)-7*loop-distance+start;
				temp=new Date(restart);
				distance+=parse(temp.getTime()-stopDate.getTime());
				flag=true;
				output(cache.concat([total,reason]));
				cache.length=0;
				if(total>=loop*span)
					loop++;
			}
		});
		return flag;
	}
	/**
	 * @param {Date} date
	 * @return {String}
	 * Dateオブジェクトを規定のフォーマット(YYYY/MM/DD hh:mm)に変換する
	 */
	function convert(date){
		return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
	}
	/**
	 * @param  {Date} date
	 * 年・月・日・時・分を保存する
	 */
	function save(date){
		cache.push(date.getFullYear());
		cache.push(date.getMonth()+1);
		cache.push(date.getDate());
		cache.push(date.getHours());
		cache.push(date.getMinutes());
	}
	/**
	 * @param {Array} data
	 * データをテーブルに出力する
	 */
	function output(data){
		const tr=document.createElement("tr");
		data.forEach(function(currentValue,index,array){
			const td=document.createElement("td");
			td.textContent=currentValue;
			tr.appendChild(td);
		});
		resultTable.appendChild(tr);
	}
	/**
	 * @param {Date} date
	 * @return {Boolean}
	 * 取り出し不可能な日又は土日かを判定する
	 */
	function check(date){
		return HOLIDAY_LIST.includes(`${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`)||date.getDay()%6==0;
	}
	/**
	 * @param {HTMLElement} targetElement
	 * 要素を選択し、クリップボードにコピーする
	 */
	function copy(element){
		const range=document.createRange();
		range.selectNode(element);
		const selection=window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand("copy");
		selection.removeRange(range);
	}
})();