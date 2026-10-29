"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:"15vh 24px",textAlign:"center"}}><h1>Не вдалося завантажити сторінку</h1><button onClick={reset}>Спробувати ще раз</button></main>;}
