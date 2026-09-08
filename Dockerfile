FROM node:22

WORKDIR /app

# Kopyalama işlemi (Önce tüm dosyaları alıyoruz)
COPY . .

# Frontend ve Backend kütüphanelerini kur
RUN npm install --prefix frontend
# Backend kütüphanelerini kurarken sqlite3'ü mecburen sıfırdan derle (GLIBC hatasını çözmek için)
RUN npm install --build-from-source=sqlite3 --prefix backend

# React (Frontend) projesini derle (Build)
RUN npm run build --prefix frontend

# Port tanımlaması (Railway otomatik ezecektir ama standarttır)
EXPOSE 5000

# Backend'i başlat
CMD ["node", "backend/index.js"]
