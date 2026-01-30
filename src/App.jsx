import React, { useState, useEffect, useRef } from "react";
import "./index.css";
import alertSound from "./assets/alert.mp3";


import dayImg from "./assets/day.jpg";
import sunsetImg from "./assets/sunset.jpg";
import nightImg from "./assets/night.jpg";

function App() {
  const [times, setTimes] = useState(null);
  const [hijri, setHijri] = useState("");
  const [city, setCity] = useState(
    localStorage.getItem("lastCity") || "Sakarya",
  );
  const [inputCity, setInputCity] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const [bgImage, setBgImage] = useState(dayImg);
  const [countdown, setCountdown] = useState("");

  const audioPlayer = useRef(new Audio(alertSound));

  // İngilizce -> Türkçe
  const prayerNamesTR = {
    Imsak: "İmsak ",
    Sunrise: "Güneş ",
    Dhuhr: "Öğle ",
    Asr: "İkindi ",
    Maghrib: "Akşam ",
    Isha: "Yatsı ",
  };

  const hijriMonthsTR = {
    1: "Muharrem",
    2: "Safer",
    3 : "Rebiülevvel",
    4: "Rebiülahir",
    5: "Cemaziyelevvel",
    6: "Cemaziyelahir",
    7: "Recep",
    8: "Şaban",
    9: "Ramazan",
    10: "Şevval",
    11: "Zilkade",
    12: "Zilhicce",
  };
  
  

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Arka plan ve Ses kontrolü
      updateEnvironment(now);
      if (times) calculateCountdown(now);
    }, 1000);
    return () => clearInterval(timer);
  }, [times, isMuted]);

  const updateEnvironment = (now) => {
    const hour = now.getHours();
    if (hour >= 6 && hour < 17) setBgImage(dayImg);
    else if (hour >= 17 && hour < 20) setBgImage(sunsetImg);
    else setBgImage(nightImg);

    if (times && !isMuted && now.getSeconds() === 0) {
      const timeString = now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (Object.values(times).includes(timeString)) {
        audioPlayer.current.play().catch((e) => console.log("Ses hatası:", e));
      }
    }
  };

  const calculateCountdown = (now) => {
    const order = ["Imsak", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    let nextPrayer = null;

    for (let p of order) {
      const [h, m] = times[p].split(":");
      const target = new Date();
      target.setHours(h, m, 0);
      if (target > now) {
        nextPrayer = { name: prayerNamesTR[p], date: target };
        break;
      }
    }

    if (!nextPrayer) {
      const [h, m] = times.Imsak.split(":");
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(h, m, 0);
      nextPrayer = { name: "İmsak", date: target };
    }

    const diff = nextPrayer.date - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setCountdown(
      <>
    {nextPrayer.name} vaktine kalan süre: <br/> 
    <strong>{`${h}:${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`}</strong>
  </>
    );
  };

  useEffect(() => {
    fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Turkey&method=13`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          setTimes(data.data.timings);
          const h = data.data.date.hijri;
          const monthTR = hijriMonthsTR[h.month.number] || h.month.number;
          setHijri(`${h.day} ${monthTR} ${h.year}`);
          localStorage.setItem("lastCity", city);

        }

      });
  }, [city]);

  
  

  return (
    <div
      className="app-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="card">
        <button className="mute-btn" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? "🔇" : "🔊"}
        </button>

        <h2 className="live-clock">
          {currentTime.toLocaleTimeString("tr-TR")}
        </h2>

        <div className="date-area">
          <p>{currentTime.toLocaleDateString("tr-TR")}</p>
          <p className="hijri-date">🌙 {hijri}</p>
        </div>

        <h3 className="city-title">{city.toUpperCase()}</h3>
        <div className="countdown-box">{countdown}</div>

        {currentTime.getDay() === 5 && (
          <div className="friday-badge">Hayırlı Cumalar</div>
        )}

        <div className="vakit-grid">
          {times &&
            Object.entries(prayerNamesTR).map(([key, label]) => (
              <div key={key} className="vakit-box">
                <strong> {label} </strong>
                &nbsp;
                <strong>{times[key]}</strong>
              </div>
            ))}
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Şehir adı..."
            onChange={(e) => setInputCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setCity(inputCity)}
          />
          <button onClick={() => setCity(inputCity)}>Değiştir</button>
        </div>
      </div>
    </div>
  );
}

export default App;
