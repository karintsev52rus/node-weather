import fetch from 'node-fetch';
import fs from 'fs';

const inputArgs = process.argv; 

function registerFlagValue(inputArgs, flagName, flagValue, userData) { // функция, которая присваивает полям объекта userData данные, введенные пользователем через аргументы.
  const flagIndex = inputArgs.indexOf(flagValue.flag)
  if (flagIndex > 0 && flagValue.requiredArg) {
    userData[flagName] = inputArgs[flagIndex + 1];
    return;
  }
  if (flagIndex > 0) {
    userData[flagName] = true;
  }
}

function getFlagValues(inputArgs, flagsConfig, userData) {
  const flagsArray = Object.entries(flagsConfig);
  flagsArray.forEach((flagData) => {
    const [flagName, flagValue] = flagData;
    registerFlagValue(inputArgs, flagName, flagValue, userData);
  });
}

const readHelpInfo = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./help.txt', 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const getData = async (userData) => {
  try {
    const { city, token } = userData;
    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${token}&q=${city}&lang=ru`
    );
    if (res.ok) {
      return await res.json();
    } else throw new Error('Не удалось получить данные');
  } catch (e) {
    console.log(e.message);
  }
};

const getWeatherData = (data) => {
  const date = data.location.localtime;
  const text = data.current.condition.text;
  const temp = data.current.temp_c;
  const city = data.location.name;
  const weatherData = `Погода в ${city} на ${date} : ${temp} градусов по Цельсию, ${text}`;
  return weatherData;
};

const getWeather = async (inputArgs) => {

  let userData = {};
  if(fs.existsSync("./weatherConfig.json")){
    userData = JSON.parse(fs.readFileSync("./weatherConfig.json", "utf-8"))
  }

  const flagsConfig = {
    city: {
      flag: '-s',
      requiredArg: true,
      name: 'city',
    },
    token: {
      flag: '-t',
      requiredArg: true,
      name: 'token',
    },
    help: {
      flag: '-h',
      requiredArg: false,
      name: 'help',
    },
  };

  if(inputArgs.length > 2){
    getFlagValues(inputArgs, flagsConfig, userData);

    if (userData.help) {
      const helpInfo = await readHelpInfo()
      console.log(helpInfo);
      return
    }
  }

  if (userData.city && userData.token) {
    getData(userData).then((data) => {
      const weatherData = getWeatherData(data);
      console.log(weatherData);
    })
  } else {
    console.log("Ошибка! Недостаточно данных для отправки запроса. Для вызова справки запустите программу с флагом -h")
  }
};

getWeather(inputArgs);
