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
	const CACHE_DATA=[],IMMOBILE_LIST=[],HOLIDAY_LIST=[];
	let base,cache,distance,finish,loop,span,start,temp,total;
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
	 * @function               onChange
	 * @param    {Event}       event
	 * @param    {Array<File>} event.target.files
	 * @this     {HTMLElement} event.target
	 * changeイベントの処理
	 */
	function onChange(event){
		switch(this){
			case pickImmobileList:
				load(this.files[0],IMMOBILE_LIST);
				break;
			case pickHolidayList:
				load(this.files[0],HOLIDAY_LIST);
				break;
		}
	}
	/**
	 * @function               onClick
	 * @param    {Event}       event
	 * @this     {HTMLElement} event.target
	 * clickイベントの処理
	 */
	function onClick(event){
		switch(this){
			case clickImmobileListPicker:
				pickImmobileList.click();
				break;
			case clickHolidayListPicker:
				pickHolidayList.click();
				break;
			case runButton:
				initialize();
				while(main());
				break;
			case copyButton:
				copyElement(resultTable);
				break;
		}
	}
	/**
	 * @function         load
	 * @param    {File}  file
	 * @param    {Array} data
	 * ファイルを読み込み、データを処理する
	 */
	function load(file,data){
		const reader=new FileReader();
		reader.addEventListener("load",function(event){
			data.length=0;
			this.result.replace(/\r/g,"").split("\n").forEach(function(currentValue,index,array){
				data.push(currentValue);
			});
		},false);
		reader.readAsText(file,"utf-8");
	}
	/**
	 * @function initialize
	 * 変数の初期化・出力テーブルの消去
	 */
	function initialize(){
		start=parseInt(inputStart.value);
		finish=parseInt(inputFinish.value);
		span=parseInt(inputSpan.value);
		total=0;
		loop=Math.floor(start/span);
		distance=0;
		temp=new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
		base=temp.getTime();
		CACHE_DATA.length=0;
		resultTable.querySelector("tbody").innerHTML="";
	}
	/**
	 * @function main
	 * メインのプログラム
	 */
	function main(){
		save();
		update(10);
		while((total=parse(temp.getTime()-base)-7*loop-distance+start)<span*(loop+1)||checkHoliday(temp)){
			temp.setDate(temp.getDate()+1);
			if(checkImmobile())
				return true;
		}
		save();
		CACHE_DATA.push(total);
		CACHE_DATA.push("");
		output();
		loop++;
		update(17);
		return total<finish;
	}
	/**
	 * @function          update
	 * @param    {number} hour
	 * 現在の時刻がhour以降なら翌日に変更し、時刻をhourに設定する
	 */
	function update(hour){
		if(temp.getHours()>hour)
			temp.setDate(temp.getDate()+1);
		temp.setHours(hour);
	}
	/**
	 * @function         parse
	 * @param   {number} millisecond
	 * @returns {number}
	 * ミリ秒を時間に変換する(変換式: millisecond/(min*sec*ms))
	 */
	function parse(millisecond){
		return Math.floor(millisecond/3600000);
	}
	/**
	 * @function           checkImmobile
	 * @returns  {boolean}
	 * 非稼働日の場合、データを出力した後にtrueを返す
	 */
	function checkImmobile(){
		let flag=false;
		IMMOBILE_LIST.forEach(function(currentValue,index,array){
			const [period,reason]=currentValue.split("_");
			const [stop,restart]=period.split("~");
			if(format().split(" ")[0]==stop.split(" ")[0]){
				const stopDate=new Date(stop);
				save(stopDate);
				total=parse(stopDate.getTime()-base)-7*loop-distance+start;
				temp=new Date(restart);
				distance+=parse(temp.getTime()-stopDate.getTime());
				flag=true;
				CACHE_DATA.push(total);
				CACHE_DATA.push(reason);
				output();
				if(total>=(loop+1)*span)
					loop++;
			}
		});
		return flag;
	}
	/**
	 * @function          format
	 * @param    {Date}   date
	 * @returns  {string}
	 * Dateオブジェクトを規定のフォーマット(YYYY/MM/DD hh:mm)に変換する
	 */
	function format(){
		return `${temp.getFullYear()}/${temp.getMonth()+1}/${temp.getDate()} ${temp.getHours()}:${temp.getMinutes()}`;
	}
	/**
	 * @function        save
	 * @param    {Date} [date=temp]
	 * 年, 月, 日, 時, 分を保存する
	 */
	function save(date){
		if(date==undefined)
			date=temp;
		CACHE_DATA.push(date.getFullYear());
		CACHE_DATA.push(date.getMonth()+1);
		CACHE_DATA.push(date.getDate());
		CACHE_DATA.push(date.getHours());
		CACHE_DATA.push(date.getMinutes());
	}
	/**
	 * @function output
	 * データをテーブルに出力する
	 */
	function output(){
		const tr=document.createElement("tr");
		CACHE_DATA.forEach(function(currentValue,index,array){
			const td=document.createElement("td");
			td.textContent=currentValue;
			tr.appendChild(td);
		});
		resultTable.querySelector("tbody").appendChild(tr);
		CACHE_DATA.length=0;
	}
	/**
	 * @function           checkHoliday
	 * @returns  {boolean}
	 * 取り出し可能な日かを判定する
	 */
	function checkHoliday(){
		return HOLIDAY_LIST.includes(`${temp.getFullYear()}/${temp.getMonth()+1}/${temp.getDate()}`)||temp.getDay()%6==0;
	}
	/**
	 * @function               copyElement
	 * @param    {HTMLElement} targetElement
	 * 要素を選択し、クリップボードにコピーする
	 */
	function copyElement(targetElement){
		const range=document.createRange();
		range.selectNode(targetElement);
		const selection=window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand("copy");
		selection.removeRange(range);
	}
})();