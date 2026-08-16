import { getApprovedListings } from "./services/firestore.js";

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    // ============================
    // HEALTH CHECK
    // ============================

    if (url.pathname === "/") {

      return Response.json({
        success: true,
        service: "ToysGuru Backend",
        version: "1.0.0",
        status: "online",
        timestamp: new Date().toISOString()
      });

    }

    // ============================
    // CONFIG API
    // ============================

    if (url.pathname === "/api/config") {

      return Response.json({
        success: true,
        message: "Backend Config API is working"
      });

    }

    // ============================
    // GET APPROVED LISTINGS
    // ============================

    if (url.pathname === "/api/listings") {

      const listings = await getApprovedListings(env);

      return Response.json({
        success: true,
        listings
      });

    }

    // ============================
    // DEFAULT
    // ============================

    return Response.json(
      {
        success: false,
        error: "Endpoint not found"
      },
      {
        status: 404
      }
    );

  }

};