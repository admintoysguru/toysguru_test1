"use strict";

/*==========================================================
  TOYSGURU — MARKETPLACE
  Cloudinary + Firebase Firestore

  REAL DATA ONLY:
  - Public marketplace = approved listings only
  - Seller submissions = pending until admin approval
  - One real front photo per listing
  - No fake/generated marketplace entries
==========================================================*/

const GRADE_POSITIONS = {
    MOC: 8,
    "Near Mint": 50,
    Loose: 92
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const CLOUDINARY_CLOUD_NAME = "yuqwfv98";
const CLOUDINARY_UPLOAD_PRESET = "toysguru_listing_images";
const CLOUDINARY_UPLOAD_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const CART_STORAGE_KEY = "toysguru_cart";


/*==========================================================
  STATE
==========================================================*/

let currentUser = null;
let approvedListings = [];
let sellerListings = [];
let currentRoomFilter = null;
let currentSearchQuery = "";
let selectedImageFile = null;
let cartItems = [];
let revealObserver = null;


/*==========================================================
  SESSION
==========================================================*/

auth.onAuthStateChanged(async user => {

    if (!user) {

        window.location.href =
            "auth.html?mode=login";

        return;
    }


    currentUser = user;

    loadCart();


    try {

        const profileDoc =
            await db
                .collection("profiles")
                .doc(user.uid)
                .get();


        const name =
            profileDoc.exists
                ? profileDoc.data().name
                : user.email;


        const nameEl =
            document.getElementById(
                "navUserName"
            );


        if (nameEl) {

            nameEl.textContent =
                (name || user.email || "Collector")
                    .split(" ")[0];

        }

    } catch (error) {

        console.error(
            "Failed to load user profile:",
            error
        );

    }


    await renderListings();

    await renderSellerListings();

});


/*==========================================================
  LOGOUT
==========================================================*/

document
    .getElementById("logoutBtn")
    ?.addEventListener(
        "click",
        async () => {

            try {

                await auth.signOut();

                window.location.href =
                    "index.html";

            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

            }

        }
    );


/*==========================================================
  FIRESTORE QUERIES
==========================================================*/

async function fetchApprovedListings() {

    try {

        const snap =
            await db
                .collection("listings")
                .where(
                    "status",
                    "==",
                    "approved"
                )
                .get();


        const listings =
            snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));


        listings.sort(
            (a, b) =>
                getTime(b.createdAt) -
                getTime(a.createdAt)
        );


        return listings;

    } catch (error) {

        console.error(
            "Failed to load approved listings:",
            error
        );

        return [];

    }

}


async function fetchSellerListings() {

    if (!currentUser) {

        return [];

    }


    try {

        const snap =
            await db
                .collection("listings")
                .where(
                    "sellerId",
                    "==",
                    currentUser.uid
                )
                .get();


        const listings =
            snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));


        listings.sort(
            (a, b) =>
                getTime(b.createdAt) -
                getTime(a.createdAt)
        );


        return listings;

    } catch (error) {

        console.error(
            "Failed to load seller listings:",
            error
        );

        return [];

    }

}


/*==========================================================
  MARKETPLACE RENDERING
==========================================================*/

function getListingImage(item) {

    return item.imageUrl || "";

}


function listingImageMarkup(item) {

    const imageUrl =
        getListingImage(item);


    if (!imageUrl) {

        return `
            <div class="listingImageEmpty">
                <span>NO PHOTO</span>
            </div>
        `;

    }


    return `
        <img
            src="${escapeHtmlAttribute(imageUrl)}"
            alt="${escapeHtmlAttribute(
                item.name || "Collector car"
            )}"
            loading="lazy">
    `;

}


function lotCard(item) {

    const grade =
        item.grade || "MOC";


    const gradePos =
        GRADE_POSITIONS[grade] ?? 50;


    const inCart =
        cartItems.some(
            cartItem =>
                cartItem.id === item.id
        );


    return `
        <article
            class="lot reveal"
            data-listing-id="${escapeHtmlAttribute(
                item.id
            )}">


            <div class="lotFrame">


                <span class="lotNumber">
                    LOT ${escapeHtml(
                        item.lotNumber || "—"
                    )}
                </span>


                <span class="lotVerified">
                    Verified
                </span>


                ${listingImageMarkup(item)}


            </div>


            <div class="lotBody">


                <div class="lotSeries">

                    ${escapeHtml(
                        item.series ||
                        item.brand ||
                        "Collector"
                    )}

                </div>


                <div class="lotName">

                    ${escapeHtml(
                        item.name ||
                        "Unnamed listing"
                    )}

                </div>


                <div class="gradeScale">


                    <div class="gradeLabels">

                        <span>
                            MOC
                        </span>

                        <span>
                            Near Mint
                        </span>

                        <span>
                            Loose
                        </span>

                    </div>


                    <div class="gradeTrack">

                        <div
                            class="gradeDot"
                            style="left:${gradePos}%">
                        </div>

                    </div>

                </div>


                <div class="lotFoot">

                    <span class="lotPrice">

                        ${escapeHtml(
                            item.price || "—"
                        )}

                    </span>


                    <span class="lotGradeText">

                        ${escapeHtml(
                            grade
                        )}

                    </span>

                </div>


                <button
                    class="lotActionBtn${inCart ? " is-added" : ""}"
                    type="button"
                    data-add-to-cart="${escapeHtmlAttribute(
                        item.id
                    )}"
                    ${inCart ? "disabled" : ""}>

                    ${
                        inCart
                            ? "Added to cart ✓"
                            : "Add to cart"
                    }

                </button>


            </div>

        </article>
    `;

}


/*==========================================================
  RENDER MARKETPLACE
==========================================================*/

async function renderListings() {

    approvedListings =
        await fetchApprovedListings();


    let filtered =
        [...approvedListings];


    if (currentRoomFilter) {

        filtered =
            filtered.filter(
                currentRoomFilter
            );

    }


    if (currentSearchQuery) {

        const q =
            currentSearchQuery.toLowerCase();


        filtered =
            filtered.filter(item => {

                const name =
                    String(
                        item.name || ""
                    ).toLowerCase();


                const brand =
                    String(
                        item.brand || ""
                    ).toLowerCase();


                const series =
                    String(
                        item.series || ""
                    ).toLowerCase();


                return (
                    name.includes(q) ||
                    brand.includes(q) ||
                    series.includes(q)
                );

            });

    }


    const gridEl =
        document.getElementById(
            "catalogGrid"
        );


    const emptyEl =
        document.getElementById(
            "marketplaceEmpty"
        );


    if (gridEl) {

        gridEl.innerHTML = "";

    }


    if (!filtered.length) {

        emptyEl?.classList.remove(
            "hidden"
        );

        return;

    }


    emptyEl?.classList.add(
        "hidden"
    );


    if (gridEl) {

        gridEl.innerHTML =
            filtered
                .map(lotCard)
                .join("");

    }


    initReveal();

    bindCartButtons();

}


/*==========================================================
  CATEGORY FILTERS
==========================================================*/

const roomMap = {

    All: null,


    "Hot Wheels":
        item =>
            String(
                item.brand || ""
            ).toLowerCase() ===
            "hot wheels",


    "Mini GT":
        item =>
            String(
                item.brand || ""
            ).toLowerCase() ===
            "mini gt",


    Vintage:
        item =>
            String(
                item.grade || ""
            ).toLowerCase() ===
            "loose"

};


document
    .querySelectorAll(".roomTab")
    .forEach(tab => {

        tab.addEventListener(
            "click",
            async () => {

                document
                    .querySelectorAll(".roomTab")
                    .forEach(
                        t =>
                            t.classList.remove(
                                "active"
                            )
                    );


                tab.classList.add(
                    "active"
                );


                currentRoomFilter =
                    roomMap[
                        tab.dataset.room
                    ] || null;


                await renderListings();

            }
        );

    });


/*==========================================================
  SEARCH
==========================================================*/

const searchInput =
    document.getElementById(
        "marketSearch"
    );


searchInput?.addEventListener(
    "input",
    async event => {

        currentSearchQuery =
            event.target.value.trim();


        await renderListings();

    }
);


/*==========================================================
  MY LISTINGS
==========================================================*/

async function renderSellerListings() {

    sellerListings =
        await fetchSellerListings();


    const totalEl =
        document.getElementById(
            "sellerTotalCount"
        );


    const pendingEl =
        document.getElementById(
            "sellerPendingCount"
        );


    const approvedEl =
        document.getElementById(
            "sellerApprovedCount"
        );


    const rejectedEl =
        document.getElementById(
            "sellerRejectedCount"
        );


    const listEl =
        document.getElementById(
            "sellerListings"
        );


    if (!listEl) {

        return;

    }


    const pending =
        sellerListings.filter(
            item =>
                item.status === "pending"
        );


    const approved =
        sellerListings.filter(
            item =>
                item.status === "approved"
        );


    const rejected =
        sellerListings.filter(
            item =>
                item.status === "rejected"
        );


    if (totalEl) {

        totalEl.textContent =
            sellerListings.length;

    }


    if (pendingEl) {

        pendingEl.textContent =
            pending.length;

    }


    if (approvedEl) {

        approvedEl.textContent =
            approved.length;

    }


    if (rejectedEl) {

        rejectedEl.textContent =
            rejected.length;

    }


    if (!sellerListings.length) {

        listEl.innerHTML = `
            <div class="sellerEmptyState">

                <h3>
                    No submissions yet.
                </h3>

                <p>
                    Your submitted cars will appear here
                    with their approval status.
                </p>

                <a
                    href="#appraisal"
                    class="emptyVaultLink"
                    data-close-after-action="myListings">

                    Submit your first car →

                </a>

            </div>
        `;

        return;

    }


    listEl.innerHTML =
        sellerListings
            .map(
                sellerListingRow
            )
            .join("");

}


function sellerListingRow(item) {

    const status =
        String(
            item.status || "pending"
        ).toLowerCase();


    const imageUrl =
        getListingImage(item);


    const imageMarkup =
        imageUrl

            ? `
                <img
                    src="${escapeHtmlAttribute(
                        imageUrl
                    )}"
                    alt="${escapeHtmlAttribute(
                        item.name || "Listing"
                    )}"
                    loading="lazy">
              `

            : `
                <div class="sellerNoPhoto">
                    NO PHOTO
                </div>
              `;


    const date =
        formatDate(
            item.createdAt
        );


    return `
        <div class="sellerListingRow">


            <div class="sellerListingThumb">

                ${imageMarkup}

            </div>


            <div class="sellerListingInfo">

                <strong>

                    ${escapeHtml(
                        item.name ||
                        "Unnamed listing"
                    )}

                </strong>


                <span>

                    ${escapeHtml(
                        item.brand ||
                        "Unknown brand"
                    )}

                    ·

                    ${escapeHtml(
                        item.price ||
                        "Price not set"
                    )}

                </span>


                <span>

                    LOT
                    ${escapeHtml(
                        item.lotNumber ||
                        "—"
                    )}

                </span>


                <span>

                    ${escapeHtml(
                        date
                    )}

                </span>

            </div>


            <div
                class="sellerStatus ${escapeHtmlAttribute(
                    status
                )}">

                ${escapeHtml(
                    status.toUpperCase()
                )}

            </div>


            <div class="sellerListingAction">

                ${
                    status === "approved"
                        ? `
                            <span class="sellerLiveTag">
                                LIVE
                            </span>
                          `
                        : ""
                }

            </div>


        </div>
    `;

}


/*==========================================================
  CART
==========================================================*/

function loadCart() {

    try {

        const stored =
            localStorage.getItem(
                CART_STORAGE_KEY
            );


        cartItems =
            stored
                ? JSON.parse(stored)
                : [];


        if (!Array.isArray(cartItems)) {

            cartItems = [];

        }

    } catch (error) {

        console.error(
            "Could not load cart:",
            error
        );


        cartItems = [];

    }


    updateCartUI();

}


function saveCart() {

    try {

        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(
                cartItems
            )
        );

    } catch (error) {

        console.error(
            "Could not save cart:",
            error
        );

    }

}


function addToCart(
    listingId
) {

    const item =
        approvedListings.find(
            listing =>
                listing.id === listingId
        );


    if (!item) {

        return;

    }


    if (
        cartItems.some(
            cartItem =>
                cartItem.id === listingId
        )
    ) {

        return;

    }


    cartItems.push({

        id:
            item.id,

        name:
            item.name ||
            "Collector item",

        brand:
            item.brand ||
            "",

        price:
            item.price ||
            "—",

        imageUrl:
            item.imageUrl ||
            "",

        lotNumber:
            item.lotNumber ||
            "—"

    });


    saveCart();

    updateCartUI();

    renderListings();

}


function removeFromCart(
    listingId
) {

    cartItems =
        cartItems.filter(
            item =>
                item.id !== listingId
        );


    saveCart();

    updateCartUI();

    renderListings();

}


function updateCartUI() {

    const countEl =
        document.getElementById(
            "cartCount"
        );


    const itemsEl =
        document.getElementById(
            "cartItems"
        );


    const subtotalEl =
        document.getElementById(
            "cartSubtotal"
        );


    const checkoutBtn =
        document.getElementById(
            "cartCheckoutBtn"
        );


    if (countEl) {

        countEl.textContent =
            cartItems.length;

    }


    if (!itemsEl) {

        return;

    }


    if (!cartItems.length) {

        itemsEl.innerHTML = `
            <div class="cartEmptyState">
                Your cart is empty.
            </div>
        `;


        if (subtotalEl) {

            subtotalEl.textContent =
                "₹0";

        }


        if (checkoutBtn) {

            checkoutBtn.disabled =
                true;

        }


        return;

    }


    itemsEl.innerHTML =
        cartItems
            .map(
                cartItemRow
            )
            .join("");


    const subtotal =
        cartItems.reduce(
            (
                sum,
                item
            ) => {

                const numericPrice =
                    Number(
                        String(
                            item.price ||
                            ""
                        )
                            .replace(
                                /[^0-9.]/g,
                                ""
                            )
                    );


                return (
                    sum +
                    (
                        Number.isFinite(
                            numericPrice
                        )
                            ? numericPrice
                            : 0
                    )
                );

            },
            0
        );


    if (subtotalEl) {

        subtotalEl.textContent =
            `₹${subtotal.toLocaleString(
                "en-IN"
            )}`;

    }


    if (checkoutBtn) {

        checkoutBtn.disabled =
            false;

    }


    bindCartRemoveButtons();

}


function cartItemRow(item) {

    const image =
        item.imageUrl

            ? `
                <img
                    src="${escapeHtmlAttribute(
                        item.imageUrl
                    )}"
                    alt="${escapeHtmlAttribute(
                        item.name
                    )}">
              `

            : `
                <div class="cartItemNoPhoto">
                    NO PHOTO
                </div>
              `;


    return `
        <div class="cartItem">


            <div class="cartItemImage">

                ${image}

            </div>


            <div class="cartItemInfo">

                <strong>
                    ${escapeHtml(
                        item.name
                    )}
                </strong>


                <span>
                    ${escapeHtml(
                        item.brand
                    )}
                </span>


                <span>
                    LOT
                    ${escapeHtml(
                        item.lotNumber
                    )}
                </span>

            </div>


            <div class="cartItemRight">

                <span class="cartItemPrice">

                    ${escapeHtml(
                        item.price
                    )}

                </span>


                <button
                    type="button"
                    class="cartRemoveBtn"
                    data-remove-cart="${escapeHtmlAttribute(
                        item.id
                    )}">

                    Remove

                </button>

            </div>


        </div>
    `;

}


function bindCartButtons() {

    document
        .querySelectorAll(
            "[data-add-to-cart]"
        )
        .forEach(button => {

            if (
                button.dataset.cartBound ===
                "true"
            ) {

                return;

            }


            button.dataset.cartBound =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    addToCart(
                        button.dataset.addToCart
                    );

                }
            );

        });

}


function bindCartRemoveButtons() {

    document
        .querySelectorAll(
            "[data-remove-cart]"
        )
        .forEach(button => {

            if (
                button.dataset.cartRemoveBound ===
                "true"
            ) {

                return;

            }


            button.dataset.cartRemoveBound =
                "true";


            button.addEventListener(
                "click",
                () => {

                    removeFromCart(
                        button.dataset.removeCart
                    );

                }
            );

        });

}


/*==========================================================
  PANELS
==========================================================*/

function openPanel(
    panelId
) {

    const panel =
        document.getElementById(
            panelId
        );


    if (!panel) {

        return;

    }


    panel.classList.remove(
        "hidden"
    );


    panel.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "panelOpen"
    );


    if (
        panelId ===
        "myListingsPanel"
    ) {

        renderSellerListings();

    }


    if (
        panelId ===
        "cartPanel"
    ) {

        updateCartUI();

    }

}


function closePanel(
    panelId
) {

    const panel =
        document.getElementById(
            panelId
        );


    if (!panel) {

        return;

    }


    panel.classList.add(
        "hidden"
    );


    panel.setAttribute(
        "aria-hidden",
        "true"
    );


    const anyOpen =
        document.querySelector(
            ".overlayPanel:not(.hidden)"
        );


    if (!anyOpen) {

        document.body.classList.remove(
            "panelOpen"
        );

    }

}


function bindPanelEvents() {

    document
        .getElementById(
            "myListingsBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                openPanel(
                    "myListingsPanel"
                );

            }
        );


    document
        .getElementById(
            "myListingsClose"
        )
        ?.addEventListener(
            "click",
            () => {

                closePanel(
                    "myListingsPanel"
                );

            }
        );


    document
        .getElementById(
            "cartBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                openPanel(
                    "cartPanel"
                );

            }
        );


    document
        .getElementById(
            "cartClose"
        )
        ?.addEventListener(
            "click",
            () => {

                closePanel(
                    "cartPanel"
                );

            }
        );


    document
        .querySelectorAll(
            "[data-close-panel]"
        )
        .forEach(
            backdrop => {

                backdrop.addEventListener(
                    "click",
                    () => {

                        closePanel(
                            backdrop.dataset.closePanel ===
                                "cart"
                                ? "cartPanel"
                                : "myListingsPanel"
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-close-after-action]"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        closePanel(
                            link.dataset.closeAfterAction ===
                                "cart"
                                ? "cartPanel"
                                : "myListingsPanel"
                        );

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closePanel(
                "myListingsPanel"
            );


            closePanel(
                "cartPanel"
            );

        }
    );


    document
        .getElementById(
            "cartCheckoutBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    !cartItems.length
                ) {

                    return;

                }


                alert(
                    "Checkout is coming soon. Your cart has been saved."
                );

            }
        );

}


bindPanelEvents();


/*==========================================================
  IMAGE UPLOAD / PREVIEW
==========================================================*/

const imageInput =
    document.getElementById(
        "aImage"
    );


const imagePreviewWrap =
    document.getElementById(
        "imagePreviewWrap"
    );


const imagePreview =
    document.getElementById(
        "imagePreview"
    );


const imageUploadContent =
    document.getElementById(
        "imageUploadContent"
    );


const imageUploadError =
    document.getElementById(
        "imageUploadError"
    );


imageInput?.addEventListener(
    "change",
    () => {

        clearImageUploadError();


        const file =
            imageInput.files?.[0];


        if (!file) {

            selectedImageFile =
                null;


            resetImagePreview();

            return;

        }


        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            showImageUploadError(
                "Please upload a JPG, PNG or WebP image."
            );


            imageInput.value =
                "";


            selectedImageFile =
                null;


            resetImagePreview();

            return;

        }


        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {

            showImageUploadError(
                "Image must be 5 MB or smaller."
            );


            imageInput.value =
                "";


            selectedImageFile =
                null;


            resetImagePreview();

            return;

        }


        selectedImageFile =
            file;


        const reader =
            new FileReader();


        reader.onload =
            event => {

                if (imagePreview) {

                    imagePreview.src =
                        event.target.result;

                }


                imageUploadContent
                    ?.classList.add(
                        "hidden"
                    );


                imagePreviewWrap
                    ?.classList.remove(
                        "hidden"
                    );

            };


        reader.onerror =
            () => {

                showImageUploadError(
                    "Could not preview this image."
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


function resetImagePreview() {

    if (imagePreview) {

        imagePreview.src =
            "";

    }


    imageUploadContent
        ?.classList.remove(
            "hidden"
        );


    imagePreviewWrap
        ?.classList.add(
            "hidden"
        );

}


function showImageUploadError(
    message
) {

    if (imageUploadError) {

        imageUploadError.textContent =
            message;

    }

}


function clearImageUploadError() {

    if (imageUploadError) {

        imageUploadError.textContent =
            "";

    }

}


/*==========================================================
  SELLER SUBMISSION — CLOUDINARY
==========================================================*/

const appraisalForm =
    document.getElementById(
        "appraisalForm"
    );


appraisalForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            showAppraisalError(
                "Your session has expired. Please sign in again."
            );


            return;

        }


        clearAppraisalStatus();


        const name =
            document
                .getElementById(
                    "aName"
                )
                ?.value
                .trim();


        const brand =
            document
                .getElementById(
                    "aBrand"
                )
                ?.value;


        const scale =
            document
                .getElementById(
                    "aScale"
                )
                ?.value;


        const priceInput =
            document
                .getElementById(
                    "aPrice"
                )
                ?.value
                .trim();


        const condition =
            document
                .getElementById(
                    "aCondition"
                )
                ?.value;


        const description =
            document
                .getElementById(
                    "aDescription"
                )
                ?.value
                .trim();


        const submitBtn =
            appraisalForm.querySelector(
                ".submitBtn"
            );


        if (
            !name ||
            !brand ||
            !priceInput ||
            !condition
        ) {

            showAppraisalError(
                "Please fill in the model name, brand, price and condition."
            );


            return;

        }


        const price =
            Number(
                priceInput
            );


        if (
            !Number.isFinite(
                price
            ) ||
            price <= 0
        ) {

            showAppraisalError(
                "Please enter a valid asking price."
            );


            return;

        }


        if (
            !selectedImageFile
        ) {

            showImageUploadError(
                "Please upload one clear front photo of the car."
            );


            document
                .getElementById(
                    "aImage"
                )
                ?.focus();


            return;

        }


        if (submitBtn) {

            submitBtn.disabled =
                true;


            submitBtn.textContent =
                "Uploading photo…";

        }


        const lotNumber =
            `TG-${Date.now()
                .toString()
                .slice(-6)}`;


        try {

            const profileDoc =
                await db
                    .collection(
                        "profiles"
                    )
                    .doc(
                        currentUser.uid
                    )
                    .get();


            const sellerName =
                profileDoc.exists
                    ? profileDoc.data().name
                    : currentUser.email;


            const formData =
                new FormData();


            formData.append(
                "file",
                selectedImageFile
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            const cloudinaryResponse =
                await fetch(
                    CLOUDINARY_UPLOAD_URL,
                    {
                        method:
                            "POST",

                        body:
                            formData

                    }
                );


            let cloudinaryData =
                null;


            try {

                cloudinaryData =
                    await cloudinaryResponse.json();

            } catch (
                parseError
            ) {

                console.error(
                    "Cloudinary returned an invalid response:",
                    parseError
                );

            }


            if (
                !cloudinaryResponse.ok ||
                !cloudinaryData?.secure_url
            ) {

                console.error(
                    "Cloudinary upload failed:",
                    cloudinaryData
                );


                throw new Error(
                    cloudinaryData?.error?.message ||
                    "The image could not be uploaded to Cloudinary."
                );

            }


            if (submitBtn) {

                submitBtn.textContent =
                    "Submitting for approval…";

            }


            await db
                .collection(
                    "listings"
                )
                .add({

                    lotNumber,

                    name,

                    brand,

                    series:
                        brand,

                    scale,

                    price:
                        `₹${price}`,

                    priceValue:
                        price,

                    grade:
                        condition,

                    description:
                        description || "",

                    imageUrl:
                        cloudinaryData.secure_url,

                    imageProvider:
                        "cloudinary",

                    imagePublicId:
                        cloudinaryData.public_id ||
                        "",

                    sellerId:
                        currentUser.uid,

                    sellerName:
                        sellerName ||
                        currentUser.email,

                    status:
                        "pending",

                    featured:
                        false,

                    createdAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp(),

                    updatedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });


            showAppraisalSuccess(
                "Submitted successfully. Your listing is now pending review and will remain private until the owner approves it."
            );


            appraisalForm.reset();


            selectedImageFile =
                null;


            resetImagePreview();


            clearImageUploadError();


            await renderSellerListings();


            openPanel(
                "myListingsPanel"
            );


        } catch (
            error
        ) {

            console.error(
                "Listing submission failed:",
                error
            );


            showAppraisalError(
                friendlyListingError(
                    error
                )
            );

        }


        if (submitBtn) {

            submitBtn.disabled =
                false;


            submitBtn.textContent =
                "Submit for approval →";

        }

    }
);


/*==========================================================
  STATUS MESSAGES
==========================================================*/

function showAppraisalError(
    message
) {

    const statusEl =
        document.getElementById(
            "appraisalStatus"
        );


    if (!statusEl) {

        return;

    }


    statusEl.textContent =
        message;


    statusEl.classList.add(
        "show"
    );


    statusEl.classList.remove(
        "success"
    );

}


function showAppraisalSuccess(
    message
) {

    const statusEl =
        document.getElementById(
            "appraisalStatus"
        );


    if (!statusEl) {

        return;

    }


    statusEl.textContent =
        message;


    statusEl.classList.add(
        "show",
        "success"
    );

}


function clearAppraisalStatus() {

    const statusEl =
        document.getElementById(
            "appraisalStatus"
        );


    if (!statusEl) {

        return;

    }


    statusEl.textContent =
        "";


    statusEl.classList.remove(
        "show",
        "success"
    );

}


function friendlyListingError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        );


    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "failed to fetch"
        )
    ) {

        return (
            "The photo upload could not reach Cloudinary. Please check your internet connection and try again."
        );

    }


    if (
        lower.includes(
            "upload preset"
        ) ||
        lower.includes(
            "unknown api key"
        )
    ) {

        return (
            "The Cloudinary image configuration is incorrect. Please check the ToysGuru Cloudinary settings."
        );

    }


    if (
        lower.includes(
            "file size"
        )
    ) {

        return (
            "The photo is too large. Please upload an image smaller than 5 MB."
        );

    }


    if (
        lower.includes(
            "format"
        ) ||
        lower.includes(
            "unsupported"
        )
    ) {

        return (
            "Please upload a JPG, PNG or WebP image."
        );

    }


    if (
        error?.code ===
            "permission-denied" ||
        error?.code ===
            "PERMISSION_DENIED"
    ) {

        return (
            "You are not allowed to submit this listing."
        );

    }


    return (
        message ||
        "Unable to submit the listing. Please try again."
    );

}


/*==========================================================
  HELPERS
==========================================================*/

function getTime(
    value
) {

    if (
        value &&
        typeof value.toMillis ===
            "function"
    ) {

        return value.toMillis();

    }


    if (
        value instanceof Date
    ) {

        return value.getTime();

    }


    if (
        typeof value ===
            "number"
    ) {

        return value;

    }


    return 0;

}


function formatDate(
    value
) {

    const timestamp =
        getTime(
            value
        );


    if (!timestamp) {

        return "Recently";

    }


    try {

        return new Intl.DateTimeFormat(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        ).format(
            new Date(
                timestamp
            )
        );

    } catch (
        error
    ) {

        return "Recently";

    }

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeHtmlAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/*==========================================================
  SCROLL REVEAL
==========================================================*/

function initReveal() {

    if (!revealObserver) {

        revealObserver =
            new IntersectionObserver(
                entries => {

                    entries.forEach(
                        entry => {

                            if (
                                !entry.isIntersecting
                            ) {

                                return;

                            }


                            entry.target.classList.add(
                                "show"
                            );


                            revealObserver.unobserve(
                                entry.target
                            );

                        }
                    );

                },
                {
                    threshold:
                        0.12
                }
            );

    }


    document
        .querySelectorAll(
            ".reveal:not(.show)"
        )
        .forEach(
            element =>
                revealObserver.observe(
                    element
                )
        );

}