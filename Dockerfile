# --- Stage 1: build the React frontend ---
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Stage 2: build and publish the .NET backend ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY backend/FinanceApp.Api/FinanceApp.Api.csproj backend/FinanceApp.Api/
RUN dotnet restore backend/FinanceApp.Api/FinanceApp.Api.csproj
COPY backend/FinanceApp.Api/ backend/FinanceApp.Api/
RUN dotnet publish backend/FinanceApp.Api/FinanceApp.Api.csproj -c Release -o /app/publish
# The API serves the SPA from wwwroot in production.
COPY --from=frontend /app/frontend/dist /app/publish/wwwroot

# --- Stage 3: runtime ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend /app/publish ./
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "FinanceApp.Api.dll"]
