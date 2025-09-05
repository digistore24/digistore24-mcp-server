#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for digistore24-api v1.0
 * Generated on: 2025-08-29T08:52:37.404Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import { setupStreamableHttpServer } from "./streamable-http.js";
import { getRequestContext } from './request-context.js';

import { z, ZodError } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, unknown>;

/**
 * Interface for security requirement
 */
interface SecurityRequirement {
    [schemeName: string]: string[];
}

/**
 * Interface for JSON Schema - flexible to match actual OpenAPI schema structure
 */
interface JsonSchema {
    [key: string]: unknown;
}

/**
 * Interface for OAuth2 security scheme - flexible to match actual structure
 */
interface OAuth2Scheme {
    [key: string]: unknown;
}

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: JsonSchema;
    method: string;
    pathTemplate: string;
    executionParameters: { name: string, in: string }[];
    requestBodyContentType?: string;
    securityRequirements: SecurityRequirement[];
}

/**
 * Server configuration
 */
export const SERVER_NAME = "digistore24-api";
export const SERVER_VERSION = "1.0";
export const API_BASE_URL = "https://www.digistore24.com/api/call";

/**
 * MCP Server instance
 */
const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
);

/**
 * Map of tool definitions by name
 */
const toolDefinitionMap: Map<string, McpToolDefinition> = new Map([

  ["PostAddbalancetopurchase", {
    name: "PostAddbalancetopurchase",
    description: `For subscription and installment payments - add balance to the order.
This will be billed with the next payments.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The Digistore24 order ID"},"amount":{"type":"number","format":"float","description":"The balance to be added in the currency of the order. If amount is <0, the balance will be reduced. The balance cannot be less than 0."}},"required":["purchase_id","amount"]},
    method: "post",
    pathTemplate: "/addBalanceToPurchase",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"amount","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCopyproduct", {
    name: "PostCopyproduct",
    description: `Copies a product on Digistore24`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"string","description":"The ID of the product to be copied"},"data":{"type":"object","properties":{"name_intern":{"type":"string","maxLength":63,"description":"Internal product name"},"product_type_id":{"type":"number","description":"Product type ID (call getGlobalSettings for valid IDs)"},"language":{"type":"string","description":"Comma separated list of languages (e.g. en,de)","default":"Current vendor's language"},"is_active":{"type":"string","enum":["Y","N"],"description":"Product activation status"},"product_group_id":{"type":"number","description":"Product group ID"},"name_de":{"type":"string","maxLength":63,"description":"German product name"},"name_en":{"type":"string","maxLength":63,"description":"English product name"},"name_es":{"type":"string","maxLength":63,"description":"Spanish product name"}},"description":"Array with product properties to change"}},"required":["product_id","data"]},
    method: "post",
    pathTemplate: "/copyProduct",
    executionParameters: [{"name":"product_id","in":"query"},{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostLogmemberaccess", {
    name: "PostLogmemberaccess",
    description: `Notifies Digistore that a buyer has logged into their Membership account and accessed the bought content.
Important for German refund handling - only for purchases without the option to refund (refund_days=0 in IPN).
Only call this function if the buyer actually has logged in.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The ID of the purchase"},"platform_name":{"type":"string","description":"The readable name of the membership area (e.g. vip club)"},"login_name":{"type":"string","description":"The buyer's username for the membership area"},"login_url":{"type":"string","description":"The URL the buyer used to login"},"number_of_unlocked_lectures":{"type":"number","minimum":0,"description":"Number of lectures the member has access to for this purchase"},"total_number_of_lectures":{"type":"number","minimum":0,"description":"Total number of lectures in the course (unlocked + locked)"},"login_at":{"type":"string","format":"date-time","description":"Date time of login. Defaults to 'now'. Use for batch logging."}},"required":["purchase_id","platform_name","login_name","login_url","number_of_unlocked_lectures","total_number_of_lectures"]},
    method: "post",
    pathTemplate: "/logMemberAccess",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"platform_name","in":"query"},{"name":"login_name","in":"query"},{"name":"login_url","in":"query"},{"name":"number_of_unlocked_lectures","in":"query"},{"name":"total_number_of_lectures","in":"query"},{"name":"login_at","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreatebillingondemand", {
    name: "PostCreatebillingondemand",
    description: `Creates a special order form URL that can be customized for the visitor.
Allows customizing customer data, prices, and other settings.
Requires "Billing on demand" right to be enabled for the vendor account.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The reference order. Must have been made with a payment method that supports rebilling."},"product_id":{"type":"string","description":"The product ID in Digistore24"},"payment_plan":{"type":"object","properties":{"first_amount":{"type":"number","description":"The purchase price or first payment amount"},"other_amounts":{"type":"number","description":"Amount of follow-up payments for subscription/installments"},"currency":{"type":"string","minLength":3,"maxLength":3,"description":"Three-character currency code (e.g. EUR or USD)"},"number_of_installments":{"type":"number","minimum":1,"description":"Number of payments including the first"},"first_billing_interval":{"type":"string","description":"Time interval between purchase and second installment (e.g. \"1_month\")"},"other_billing_intervals":{"type":"string","description":"Time interval for second and further payments"},"test_interval":{"type":"string","description":"Test interval before payment starts (e.g. \"1_month\")"},"template":{"type":"string","description":"ID of payment method used as template"},"upgrade_type":{"type":"string","enum":["upgrade","downgrade"],"default":"upgrade","description":"Type of upgrade handling"}},"description":"Data for the purchase price/payment plan"},"tracking":{"type":"object","properties":{"custom":{"type":"string","description":"Custom value for order reference"},"affiliate":{"type":"string","description":"Affiliate's Digistore24 ID"},"campaignkey":{"type":"string","description":"Campaign key of the affiliate"},"trackingkey":{"type":"string","description":"Vendor's tracking key"}},"description":"Data for tracking"},"placeholders":{"type":"object","additionalProperties":{"type":"string"},"description":"Placeholders for product title and description"},"settings":{"type":"object","properties":{"voucher_code":{"type":"string","description":"Voucher to apply at payment"},"quantity":{"type":"number","minimum":1,"default":1,"description":"Quantity of the main product"},"product_country":{"type":"string","minLength":2,"maxLength":2,"description":"Two-letter country code for the product"}},"description":"Additional settings for the order form"},"addons":{"type":"array","items":{"type":"object","properties":{"product_id":{"type":"string","description":"Product ID of the addon"},"first_amount":{"type":"number","description":"First payment amount for subscription/installment"},"other_amounts":{"type":"number","description":"Follow-up payment amounts"},"single_amount":{"type":"number","description":"Purchase amount for single payments"},"quantity":{"type":"number","minimum":1,"default":1,"description":"Quantity of the addon"},"currency":{"type":"string","minLength":3,"maxLength":3,"description":"Three-character currency code"},"is_quantity_editable_after_purchase":{"type":"string","enum":["Y","N"],"default":"N","description":"Can buyer change quantity after purchase"},"product_country":{"type":"string","minLength":2,"maxLength":2,"description":"Two-letter country code for the addon"}}},"description":"List of add-on products"}},"required":["purchase_id","product_id"]},
    method: "post",
    pathTemplate: "/createBillingOnDemand",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"product_id","in":"query"},{"name":"payment_plan","in":"query"},{"name":"tracking","in":"query"},{"name":"placeholders","in":"query"},{"name":"settings","in":"query"},{"name":"addons","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateaddonchangepurchase", {
    name: "PostCreateaddonchangepurchase",
    description: `Creates a package change order to add or remove products from an order.
The main product's quantity cannot be changed.
Added products must be subscriptions.
Requires "Billing on demand" right to be enabled for the vendor account.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The reference order. Must have been made with a payment method that supports rebilling."},"addons":{"type":"array","items":{"type":"object","required":["product_id"],"properties":{"product_id":{"type":"number","description":"Digistore24 product ID"},"amount":{"type":"number","format":"float","description":"The rebilling amount of the subscription"},"quantity":{"type":"number","minimum":1,"default":1,"description":"Quantity of the addon"},"is_quantity_editable_after_purchase":{"type":"string","enum":["Y","N"],"default":"N","description":"Can buyer change quantity after purchase"}}},"description":"List of add-on products"},"tracking":{"type":"object","properties":{"custom":{"type":"string","description":"Custom value for order reference"},"affiliate":{"type":"string","description":"Affiliate's Digistore24 ID"},"campaignkey":{"type":"string","description":"Campaign key of the affiliate"},"trackingkey":{"type":"string","description":"Vendor's tracking key"}},"description":"Data for tracking. Fields not provided are taken from the initial purchase."},"placeholders":{"type":"object","additionalProperties":{"type":"string"},"description":"Placeholders for product title and description"}},"required":["purchase_id","addons"]},
    method: "post",
    pathTemplate: "/createAddonChangePurchase",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"addons","in":"query"},{"name":"tracking","in":"query"},{"name":"placeholders","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreatebuyurl", {
    name: "PostCreatebuyurl",
    description: `Creates a special order form URL that can be customized for the visitor.
For example, customer data can be entered and set as read-only. Prices can also be changed.
`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"string","description":"The ID of the product in Digistore24"},"buyer":{"type":"object","properties":{"email":{"type":"string","format":"email"},"salutation":{"type":"string","enum":["M","F"],"description":"M (male) or F (female)"},"title":{"type":"string","description":"e.g. \"Prof.\" or \"Dr.\""},"last_name":{"type":"string"},"first_name":{"type":"string"},"company":{"type":"string"},"street":{"type":"string"},"city":{"type":"string"},"zipcode":{"type":"string"},"state":{"type":"string"},"country":{"type":"string","minLength":2,"maxLength":2,"description":"Two-digit country code"},"phone_no":{"type":"string"},"tax_id":{"type":"string"},"readonly_keys":{"type":"string","enum":["all","email","email_and_name","none"],"default":"none","description":"Indicates which fields are read-only"},"id":{"type":"string","description":"Buyer ID or order ID to use existing address"}},"description":"Buyer data"},"payment_plan":{"type":"object","properties":{"first_amount":{"type":"number","description":"Purchase price or first payment amount"},"other_amounts":{"type":"number","description":"Amount for follow-up payments"},"currency":{"type":"string","minLength":3,"maxLength":3,"description":"Three-digit currency code (e.g. EUR or USD)"},"number_of_installments":{"type":"number","minimum":0,"default":1,"description":"Number of payments (1=single payment, 0=subscription)"},"first_billing_interval":{"type":"string","default":"1_month","description":"Time interval between purchase and second installment"},"other_billing_intervals":{"type":"string","description":"Time interval for second and further payments"},"test_interval":{"type":"string","description":"Test period before payment starts"},"template":{"type":"string","description":"ID of payment method template"},"upgrade_order_id":{"type":"string","description":"Order ID for upgrade purchase"},"upgrade_type":{"type":"string","enum":["upgrade","downgrade"],"default":"upgrade","description":"Type of upgrade"},"tax_mode":{"type":"string","enum":["as_set","exclude","include"],"default":"as_set","description":"Tax calculation mode"}},"description":"Purchase price/payment plan data"},"tracking":{"type":"object","properties":{"custom":{"type":"string","description":"Custom value for order reference"},"affiliate":{"type":"string","description":"Affiliate's Digistore24 ID"},"affiliate_priority":{"type":"string","enum":["email","as_set"],"default":"as_set","description":"Priority for affiliate selection"},"campaignkey":{"type":"string","description":"Campaign key of the affiliate"},"trackingkey":{"type":"string","description":"Vendor's tracking key"},"utm_source":{"type":"string"},"utm_medium":{"type":"string"},"utm_campaign":{"type":"string"},"utm_term":{"type":"string"},"utm_content":{"type":"string"}},"description":"Tracking data"},"valid_until":{"type":"string","description":"Time period until link becomes invalid. Use 'forever' for no expiration."},"urls":{"type":"object","properties":{"thankyou_url":{"type":"string","description":"Custom thank you page URL"},"fallback_url":{"type":"string","description":"URL for invalid links"},"upgrade_error_url":{"type":"string","description":"URL for failed upgrades"}},"description":"Custom URLs"},"placeholders":{"type":"object","additionalProperties":{"type":"string"},"description":"Placeholders for product title and description"},"settings":{"type":"object","properties":{"orderform_id":{"type":"string","description":"ID of the order form"},"img":{"oneOf":[{"type":"string"},{"type":"object","additionalProperties":{"type":"string"}}],"description":"Product image ID or mapping"},"affiliate_commission_rate":{"type":"number","description":"Affiliate commission percentage"},"affiliate_commission_fix":{"type":"number","description":"Fixed affiliate commission amount"},"voucher_code":{"type":"string","description":"Voucher code to apply"},"voucher_1st_rate":{"type":"number","description":"Discount percentage on first payment"},"voucher_oth_rates":{"type":"number","description":"Discount percentage on follow-up payments"},"voucher_1st_amount":{"type":"number","description":"Discount amount on first payment"},"voucher_oth_amounts":{"type":"number","description":"Discount amount on follow-up payments"},"force_rebilling":{"type":"boolean","description":"Require payment method supporting automated payments"},"pay_methods":{"type":"array","items":{"type":"string","enum":["paypal","sezzle","creditcard","elv","banktransfer","klarna"]},"description":"Allowed payment methods"}},"description":"Additional order form settings"},"addons":{"type":"array","items":{"type":"object","properties":{"product_id":{"type":"string","description":"Product ID of addon"},"first_amount":{"type":"number","description":"First payment amount for subscription/installment"},"other_amounts":{"type":"number","description":"Follow-up payment amounts"},"single_amount":{"type":"number","description":"Purchase amount for single payments"},"default_quantity":{"type":"number","minimum":1,"default":1,"description":"Preselected quantity"},"max_quantity_type":{"type":"string","enum":["unlimited","like_main_item","number"],"default":"unlimited","description":"Maximum quantity type"},"max_quantity":{"type":"number","minimum":1,"description":"Maximum purchasable quantity"},"currency":{"type":"string","minLength":3,"maxLength":3,"description":"Three-character currency code"},"is_quantity_editable_before_purchase":{"type":"string","enum":["Y","N"],"default":"N","description":"Can buyer change quantity before purchase"},"is_quantity_editable_after_purchase":{"type":"string","enum":["Y","N"],"default":"N","description":"Can buyer change quantity after purchase"}}},"description":"List of add-on products"}},"required":["product_id"]},
    method: "post",
    pathTemplate: "/createBuyUrl",
    executionParameters: [{"name":"product_id","in":"query"},{"name":"buyer","in":"query"},{"name":"payment_plan","in":"query"},{"name":"tracking","in":"query"},{"name":"valid_until","in":"query"},{"name":"urls","in":"query"},{"name":"placeholders","in":"query"},{"name":"settings","in":"query"},{"name":"addons","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateimage", {
    name: "PostCreateimage",
    description: `Creates an image on Digistore24`,
    inputSchema: {"type":"object","properties":{"data":{"type":"object","required":["name","image-url"],"properties":{"name":{"type":"string","maxLength":63,"description":"Name of the image"},"image-url":{"type":"string","format":"uri","description":"URL from which Digistore24 copies the image"},"usage_type":{"type":"string","description":"Purpose of the images (e.g. 'product'). See getGlobalSettings() image_usage_type field."},"alt_tag":{"type":"string","description":"Alternative text for the image"}},"description":"Image data and properties"}},"required":["data"]},
    method: "post",
    pathTemplate: "/createImage",
    executionParameters: [{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateeticket", {
    name: "PostCreateeticket",
    description: `Creates free etickets for events`,
    inputSchema: {"type":"object","properties":{"buyer":{"type":"object","properties":{"email":{"type":"string","format":"email"},"title":{"type":"string"},"salutation":{"type":"string","enum":["m","f"],"description":"m (male) or f (female)"},"last_name":{"type":"string"},"first_name":{"type":"string"}},"description":"Buyer information"},"product_id":{"type":"string","description":"The product ID"},"location_id":{"type":"string","description":"The location ID (see listEticketLocations())"},"template_id":{"type":"string","description":"The template ID (see listEticketTemplates())"},"date":{"type":"string","format":"date","description":"Event date"},"days":{"type":"number","minimum":1,"default":1,"description":"Number of days of the event"},"note":{"type":"string","description":"Optional note (e.g. time)"},"count":{"type":"number","minimum":1,"default":1,"description":"Number of etickets to create"}},"required":["buyer","product_id","location_id","template_id","date"]},
    method: "post",
    pathTemplate: "/createEticket",
    executionParameters: [{"name":"buyer","in":"query"},{"name":"product_id","in":"query"},{"name":"location_id","in":"query"},{"name":"template_id","in":"query"},{"name":"date","in":"query"},{"name":"days","in":"query"},{"name":"note","in":"query"},{"name":"count","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateorderform", {
    name: "PostCreateorderform",
    description: `Creates an order form on Digistore24`,
    inputSchema: {"type":"object","properties":{"data":{"type":"object","required":["name"],"properties":{"name":{"type":"string","maxLength":63,"description":"Name of the order form"},"layout":{"type":"string","enum":["widget","legacy"],"default":"widget","description":"Order form layout type (responsive not supported)"},"background_style":{"type":"string","enum":["white","blue"],"description":"Background style"},"step_count":{"type":"number","enum":[1,2,3],"description":"Number of steps/tabs in the order form"},"shipping_position":{"type":"string","enum":["after_cart","before_cart"],"description":"Position of shipping details relative to cart"},"summary_positions":{"type":"string","description":"Comma-separated positions for purchase order summaries (before_playplan,after_payplan,before_checkout,before_pay_button,after_pay_button)"},"flex_elements_order":{"type":"string","enum":["order_bumper","order_summary","refund_waiver","order_bumper","refund_waiver","order_summary","order_summary","order_bumper","refund_waiver","order_summary","refund_waiver","order_bumper","refund_waiver","order_bumper","order_summary","refund_waiver","order_summary","order_bumper"],"description":"Order of elements (order bumper, summary, refund waiver)"},"tab_style":{"type":"string","enum":["bigtabs","image","image_url"],"description":"Style of tabs"},"tab_text_1_hl":{"type":"string","description":"Title of first tab (for bigtabs)"},"tab_text_1_sl":{"type":"string","description":"Subtitle of first tab (for bigtabs)"},"tab_text_2_hl":{"type":"string","description":"Title of second tab (for bigtabs)"},"tab_text_2_sl":{"type":"string","description":"Subtitle of second tab (for bigtabs)"},"tab_text_3_hl":{"type":"string","description":"Title of third tab (for bigtabs)"},"tab_text_3_sl":{"type":"string","description":"Subtitle of third tab (for bigtabs)"},"tab_image_1_id":{"type":"string","description":"Image ID for tabs when first tab selected"},"tab_image_2_id":{"type":"string","description":"Image ID for tabs when second tab selected"},"tab_image_3_id":{"type":"string","description":"Image ID for tabs when third tab selected"},"tab_image_1_url":{"type":"string","format":"uri","description":"Image URL for tabs when first tab selected (400x80px)"},"tab_image_2_url":{"type":"string","format":"uri","description":"Image URL for tabs when second tab selected (400x80px)"},"tab_image_3_url":{"type":"string","format":"uri","description":"Image URL for tabs when third tab selected (400x80px)"},"order_bump_style":{"type":"string","enum":["none","dashed"],"description":"Style of order bump display"},"orderbump_product_id":{"type":"string","description":"Product ID for order bump (must be addon of main product)"},"orderbump_headline":{"type":"string","description":"Headline for order bump"},"orderbump_html":{"type":"string","description":"Text content for order bump"},"orderbump_position":{"type":"string","enum":["before_playplan","after_payplan","before_checkout","before_pay_button","after_pay_button"],"description":"Position of order bump"},"refund_waiver_position":{"type":"string","enum":["before_playplan","after_payplan","before_checkout","before_pay_button","after_pay_button"],"description":"Position of refund waiver"},"custom_css":{"type":"string","description":"Custom CSS for the order form"}},"description":"Property fields of the order form"}},"required":["data"]},
    method: "post",
    pathTemplate: "/createOrderform",
    executionParameters: [{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreatepaymentplan", {
    name: "PostCreatepaymentplan",
    description: `Creates a payment plan for a product on Digistore24`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"string","description":"Product ID to add the payment plan to"},"data":{"type":"object","properties":{"first_amount":{"type":"number","description":"Amount of first payment"},"first_billing_interval":{"type":"string","description":"Interval between purchase and second payment"},"currency":{"type":"string","minLength":3,"maxLength":3,"description":"Three-character currency code"},"other_amounts":{"type":"number","description":"Amount for follow-up payments"},"other_billing_intervals":{"type":"string","description":"Interval for follow-up payments"},"number_of_installments":{"type":"number","minimum":0,"description":"Number of installments (0=subscription, 1=single payment, >=2=installment)"},"is_active":{"type":"boolean","description":"Whether the payment plan is active"},"cancel_policy":{"type":"string","enum":["6m_0","6m_6m","6m_12m","12m_0","12m_3m","12m_6m","12m_12m","24m_0","24m_6m","24m_12m"],"description":"Minimum term policy"}},"description":"Payment plan properties"}},"required":["product_id","data"]},
    method: "post",
    pathTemplate: "/createPaymentplan",
    executionParameters: [{"name":"product_id","in":"query"},{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateproduct", {
    name: "PostCreateproduct",
    description: `Creates a product on Digistore24`,
    inputSchema: {"type":"object","properties":{"data":{"type":"object","properties":{"name_intern":{"type":"string","maxLength":63,"description":"Internal product name"},"name_de":{"type":"string","maxLength":63,"description":"German product name"},"name_en":{"type":"string","maxLength":63,"description":"English product name"},"name_es":{"type":"string","maxLength":63,"description":"Spanish product name"},"description_de":{"type":"string","description":"German product description (filtered HTML)"},"description_en":{"type":"string","description":"English product description (filtered HTML)"},"description_es":{"type":"string","description":"Spanish product description (filtered HTML)"},"salespage_url":{"type":"string","maxLength":255,"description":"Sales page URL"},"upsell_salespage_url":{"type":"string","maxLength":255,"description":"Upsell sales page URL"},"thankyou_url":{"type":"string","maxLength":255,"description":"Thank you page URL"},"image_url":{"type":"string","maxLength":255,"description":"Product image URL"},"product_type_id":{"type":"number","description":"Product type ID (see getGlobalSettings product_types)"},"approval_status":{"type":"string","enum":["new","pending"],"description":"Product approval status"},"affiliate_commission":{"type":"number","format":"float","description":"Affiliate commission amount"},"buyer_type":{"type":"string","enum":["consumer","business"],"description":"consumer=prices include VAT, business=prices exclude VAT"},"is_address_input_mandatory":{"type":"string","enum":["Y","N"],"description":"Y=buyer must always enter address, N=only when required for delivery"},"add_order_data_to_thankyou_page_url":{"type":"string","enum":["Y","N"],"description":"Y=add order data to thankyou URL, N=no order data added"}},"description":"Product properties"}},"required":["data"]},
    method: "post",
    pathTemplate: "/createProduct",
    executionParameters: [{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateproductgroup", {
    name: "PostCreateproductgroup",
    description: `Creates a product group (folder) for organizing products`,
    inputSchema: {"type":"object","properties":{"data":{"type":"object","required":["name"],"properties":{"name":{"type":"string","maxLength":31,"description":"Product group name"},"position":{"type":"number","default":10,"description":"Display order position"},"is_shown_as_tab":{"type":"string","enum":["Y","N"],"description":"Whether the group is displayed as a tab in the product list"}},"description":"Product group properties"}},"required":["data"]},
    method: "post",
    pathTemplate: "/createProductGroup",
    executionParameters: [{"name":"data","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateshippingcostpolicy", {
    name: "PostCreateshippingcostpolicy",
    description: `Creates a new shipping cost policy with the specified parameters`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","properties":{"name":{"type":"string","maxLength":63,"description":"Name of the shipping cost policy"},"label_XX":{"type":"string","maxLength":63,"description":"Label shown on orderform. Replace XX with language code"},"position":{"type":"number","default":100,"description":"Display position"},"is_active":{"type":"boolean","default":true,"description":"Whether the policy is active"},"for_product_ids":{"type":"string","description":"Comma separated list of product IDs this policy applies to"},"for_countries":{"type":"string","description":"Comma separated list of ISO country codes (e.g. US,DE)"},"for_currencies":{"type":"string","description":"Comma separated list of currency codes (e.g. USD,EUR)"},"fee_type":{"type":"string","enum":["total_fee","fee_per_unit"],"description":"Type of fee calculation"},"billing_cycle":{"type":"string","enum":["once","monthly"],"description":"When the shipping fee is charged"},"currency":{"type":"string","description":"Currency code for the fees (e.g. USD)"},"scale_level_count":{"type":"number","minimum":1,"maximum":5,"default":1,"description":"Number of discount levels (1-5)"},"scale_1_amount":{"type":"number","format":"float","description":"Base shipping cost amount"},"scale_2_from":{"type":"number","description":"Number of items for second discount level"},"scale_2_amount":{"type":"number","format":"float","description":"Shipping cost for scale_2_from or more items"},"scale_3_from":{"type":"number","description":"Number of items for third discount level"},"scale_3_amount":{"type":"number","format":"float","description":"Shipping cost for scale_3_from or more items"},"scale_4_from":{"type":"number","description":"Number of items for fourth discount level"},"scale_4_amount":{"type":"number","format":"float","description":"Shipping cost for scale_4_from or more items"},"scale_5_from":{"type":"number","description":"Number of items for fifth discount level"},"scale_5_amount":{"type":"number","format":"float","description":"Shipping cost for scale_5_from or more items"}},"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/createShippingCostPolicy",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateupgrade", {
    name: "PostCreateupgrade",
    description: `Creates a new upgrade option between products`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","required":["name","to_product_id"],"properties":{"name":{"type":"string","description":"Name of the new upgrade"},"to_product_id":{"type":"number","description":"The product ID being sold as the upgrade"},"upgrade_from":{"type":"string","description":"Comma-separated list of product IDs that can be upgraded from. Changes take effect immediately.","default":""},"downgrade_from":{"type":"string","description":"Comma-separated list of product IDs that can be downgraded from. Changes take effect next billing period.","default":""},"special_offer_for":{"type":"string","description":"Comma-separated list of product IDs eligible for special member offers","default":""},"fallback_product_id":{"type":["number","null"],"description":"Product ID to offer if upgrade is not possible","default":null},"is_active":{"type":"string","enum":["Y","N"],"default":"Y","description":"Whether the upgrade is active and purchasable"},"buyer_readonly_keys":{"type":"string","enum":["none","email","email_and_name","all"],"default":"none","description":"Determines which buyer data fields are protected:\n* none - All fields editable\n* email - Only email protected\n* email_and_name - Email and name protected\n* all - All fields protected\n"}},"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/createUpgrade",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreateupgradepurchase", {
    name: "PostCreateupgradepurchase",
    description: `Performs an upgrade without user interaction.
Requires full access rights and "Billing on demand" permission.
Note: You must ensure the buyer is informed and agrees to automatic upgrades.
`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","required":["purchase_ids","upgrade_id"],"properties":{"purchase_ids":{"type":"string","description":"Comma-separated list of purchase IDs. One matching purchase will be selected for upgrade."},"upgrade_id":{"type":"string","description":"ID of the upgrade to apply. Can be numeric ID (NNN) or ID with authkey (NNN-XXXXXXX)."},"payment_plan_id":{"type":"string","description":"ID or index (starting with 1) of the payment plan to apply to the new purchase"},"quantities":{"type":"object","description":"Quantities for main product and addons. Keys can be either:\n- Item positions (starting with 1)\n- Product IDs\n"}},"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/createUpgradePurchase",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreatevoucher", {
    name: "PostCreatevoucher",
    description: `Creates a new discount code/voucher`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","required":["code"],"properties":{"code":{"type":"string","description":"The voucher code"},"product_ids":{"type":"string","description":"Comma-separated list of product IDs this voucher applies to","default":"all"},"valid_from":{"type":"string","format":"date-time","description":"Point in time from when the code becomes valid (e.g. 2017-12-31 12:00:00)"},"expires_at":{"type":"string","format":"date-time","description":"Point in time when the code becomes invalid"},"first_rate":{"type":"number","format":"float","description":"Discount percentage on first payment (subscriptions/installments) or single payment"},"other_rates":{"type":"number","format":"float","description":"Discount percentage on follow-up payments (subscriptions/installments)"},"first_amount":{"type":"number","format":"float","description":"Fixed discount amount on first/single payment"},"other_amounts":{"type":"number","format":"float","description":"Fixed discount amount on follow-up payments"},"currency":{"type":"string","description":"Currency code for the fixed discount amounts"},"is_count_limited":{"type":"boolean","default":false,"description":"Whether the number of uses is limited"},"count_left":{"type":"number","default":1,"description":"Number of remaining uses if is_count_limited is true"},"upgrade_policy":{"type":"string","enum":["valid","other_only","not_valid"],"default":"valid","description":"How the code is used for upgrades:\n* valid - voucher fully usable\n* other_only - only discount on follow-up installments\n* not_valid - voucher not usable\n"}},"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/createVoucher",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeletebuyurl", {
    name: "DeleteDeletebuyurl",
    description: `Deletes a BuyUrl object`,
    inputSchema: {"type":"object","properties":{"id":{"type":"number","description":"ID of the BuyUrl object to delete"}},"required":["id"]},
    method: "delete",
    pathTemplate: "/deleteBuyUrl",
    executionParameters: [{"name":"id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteimage", {
    name: "DeleteDeleteimage",
    description: `Deletes an image from the system`,
    inputSchema: {"type":"object","properties":{"image_id":{"type":"number","description":"ID of the image to delete"}},"required":["image_id"]},
    method: "delete",
    pathTemplate: "/deleteImage",
    executionParameters: [{"name":"image_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteorderform", {
    name: "DeleteDeleteorderform",
    description: `Deletes an order form from the system`,
    inputSchema: {"type":"object","properties":{"orderform_id":{"type":"number","description":"ID of the order form to delete"}},"required":["orderform_id"]},
    method: "delete",
    pathTemplate: "/deleteOrderform",
    executionParameters: [{"name":"orderform_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeletepaymentplan", {
    name: "DeleteDeletepaymentplan",
    description: `Deletes a payment plan for a product on Digistore24`,
    inputSchema: {"type":"object","properties":{"paymentplan_id":{"type":"number","description":"ID of the payment plan to delete"}},"required":["paymentplan_id"]},
    method: "delete",
    pathTemplate: "/deletePaymentplan",
    executionParameters: [{"name":"paymentplan_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteproduct", {
    name: "DeleteDeleteproduct",
    description: `Deletes a user's Digistore24 product`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"ID of the product to delete"}},"required":["product_id"]},
    method: "delete",
    pathTemplate: "/deleteProduct",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteproductgroup", {
    name: "DeleteDeleteproductgroup",
    description: `Deletes a product group from Digistore24`,
    inputSchema: {"type":"object","properties":{"product_group_id":{"type":"number","description":"ID of the product group to delete"}},"required":["product_group_id"]},
    method: "delete",
    pathTemplate: "/deleteProductGroup",
    executionParameters: [{"name":"product_group_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteshippingcostpolicy", {
    name: "DeleteDeleteshippingcostpolicy",
    description: `Deletes a shipping cost policy from Digistore24`,
    inputSchema: {"type":"object","properties":{"policy_id":{"type":"number","description":"ID of the shipping cost policy to delete"}},"required":["policy_id"]},
    method: "delete",
    pathTemplate: "/deleteShippingCostPolicy",
    executionParameters: [{"name":"policy_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteupgrade", {
    name: "DeleteDeleteupgrade",
    description: `Deletes an upgrade from Digistore24`,
    inputSchema: {"type":"object","properties":{"upgrade_id":{"type":"number","description":"ID of the upgrade to delete"}},"required":["upgrade_id"]},
    method: "delete",
    pathTemplate: "/deleteUpgrade",
    executionParameters: [{"name":"upgrade_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeleteupsells", {
    name: "DeleteDeleteupsells",
    description: `Delete all upsells for a Digistore24 product`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"ID of the product whose upsells should be deleted"}},"required":["product_id"]},
    method: "delete",
    pathTemplate: "/deleteUpsells",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["DeleteDeletevoucher", {
    name: "DeleteDeletevoucher",
    description: `Deletes a discount code/voucher`,
    inputSchema: {"type":"object","properties":{"code":{"type":"string","description":"The voucher code or voucher ID to delete"}},"required":["code"]},
    method: "delete",
    pathTemplate: "/deleteVoucher",
    executionParameters: [{"name":"code","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetaffiliatecommission", {
    name: "GetGetaffiliatecommission",
    description: `Returns the affiliate commission details for an affiliate`,
    inputSchema: {"type":"object","properties":{"affiliate_id":{"type":"string","description":"ID, name or email of the affiliate"},"product_ids":{"type":"string","default":"all","description":"Comma-separated list of product IDs or \"all\" for all products"}},"required":["affiliate_id"]},
    method: "get",
    pathTemplate: "/getAffiliateCommission",
    executionParameters: [{"name":"affiliate_id","in":"query"},{"name":"product_ids","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetbuyer", {
    name: "GetGetbuyer",
    description: `Returns a buyer's data record including address information`,
    inputSchema: {"type":"object","properties":{"buyer_id":{"type":"number","description":"ID of the buyer to retrieve"}},"required":["buyer_id"]},
    method: "get",
    pathTemplate: "/getBuyer",
    executionParameters: [{"name":"buyer_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetdelivery", {
    name: "GetGetdelivery",
    description: `Returns a delivery data record including address and tracking information`,
    inputSchema: {"type":"object","properties":{"delivery_id":{"type":"number","description":"ID of the delivery to retrieve"},"set_in_progress":{"type":"boolean","default":false,"description":"If true, marks the delivery as in progress if not already marked"}},"required":["delivery_id"]},
    method: "get",
    pathTemplate: "/getDelivery",
    executionParameters: [{"name":"delivery_id","in":"query"},{"name":"set_in_progress","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGeteticket", {
    name: "GetGeteticket",
    description: `Returns details of an e-ticket by its ID`,
    inputSchema: {"type":"object","properties":{"eticket_id":{"type":"string","pattern":"^\\d{20}$","description":"20-digit numeric e-ticket ID"}},"required":["eticket_id"]},
    method: "get",
    pathTemplate: "/getEticket",
    executionParameters: [{"name":"eticket_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGeteticketsettings", {
    name: "GetGeteticketsettings",
    description: `Returns the e-ticket templates and event locations set up for the Digistore24 account`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/getEticketSettings",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetglobalsettings", {
    name: "GetGetglobalsettings",
    description: `Returns global Digistore24 settings like allowed image sizes and system types`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/getGlobalSettings",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetimage", {
    name: "GetGetimage",
    description: `Returns an image's properties`,
    inputSchema: {"type":"object","properties":{"image_id":{"type":"string","description":"Alphanumeric ID of the image"}},"required":["image_id"]},
    method: "get",
    pathTemplate: "/getImage",
    executionParameters: [{"name":"image_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetmarketplaceentry", {
    name: "GetGetmarketplaceentry",
    description: `Returns details of a single marketplace entry including statistics`,
    inputSchema: {"type":"object","properties":{"entry_id":{"type":"number","description":"ID of the marketplace entry to retrieve"}},"required":["entry_id"]},
    method: "get",
    pathTemplate: "/getMarketplaceEntry",
    executionParameters: [{"name":"entry_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetserviceproofrequest", {
    name: "GetGetserviceproofrequest",
    description: `Retrieves details of a service proof request.
These are created when a buyer requests a refund and Digistore24 needs proof that the service was provided,
especially for sales in Germany where the right to refund can be voided.
`,
    inputSchema: {"type":"object","properties":{"service_proof_id":{"type":"number","description":"Numeric ID of the service proof request"}},"required":["service_proof_id"]},
    method: "get",
    pathTemplate: "/getServiceProofRequest",
    executionParameters: [{"name":"service_proof_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetorderform", {
    name: "GetGetorderform",
    description: `Returns details of an order form`,
    inputSchema: {"type":"object","properties":{"orderform_id":{"type":"number","description":"ID of the order form to retrieve"}},"required":["orderform_id"]},
    method: "get",
    pathTemplate: "/getOrderform",
    executionParameters: [{"name":"orderform_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetorderformmetas", {
    name: "GetGetorderformmetas",
    description: `Returns metadata and configuration options for order form editing`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/getOrderformMetas",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetproduct", {
    name: "GetGetproduct",
    description: `Returns details of a Digistore24 product`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"Numeric ID of the product to retrieve"}},"required":["product_id"]},
    method: "get",
    pathTemplate: "/getProduct",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetproductgroup", {
    name: "GetGetproductgroup",
    description: `Returns details of a single product group`,
    inputSchema: {"type":"object","properties":{"product_group_id":{"type":"number","description":"ID of the product group to retrieve"}},"required":["product_group_id"]},
    method: "get",
    pathTemplate: "/getProductGroup",
    executionParameters: [{"name":"product_group_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetshippingcostpolicy", {
    name: "GetGetshippingcostpolicy",
    description: `Returns details of a shipping cost policy`,
    inputSchema: {"type":"object","properties":{"policy_id":{"type":"number","description":"ID of the shipping cost policy to retrieve"}},"required":["policy_id"]},
    method: "get",
    pathTemplate: "/getShippingCostPolicy",
    executionParameters: [{"name":"policy_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetpurchase", {
    name: "GetGetpurchase",
    description: `Returns details for one or more orders`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"Single Digistore24 order ID or comma-separated list of order IDs"}},"required":["purchase_id"]},
    method: "get",
    pathTemplate: "/getPurchase",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetcustomertoaffiliatebuyerdetails", {
    name: "GetGetcustomertoaffiliatebuyerdetails",
    description: `Returns details on the customer to affiliate program for specific buyer(s).
Requires customer-to-affiliate program to be set up in Digistore24 first.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"Single Digistore24 order ID or comma-separated list of order IDs"}},"required":["purchase_id"]},
    method: "get",
    pathTemplate: "/getCustomerToAffiliateBuyerDetails",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetpurchasetracking", {
    name: "GetGetpurchasetracking",
    description: `Returns tracking data for one or more orders`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"Single Digistore24 order ID or comma-separated list of order IDs"}},"required":["purchase_id"]},
    method: "get",
    pathTemplate: "/getPurchaseTracking",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetpurchasedownloads", {
    name: "GetGetpurchasedownloads",
    description: `Returns download information for purchased digital products`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"Single Digistore24 order ID or comma-separated list of order IDs"}},"required":["purchase_id"]},
    method: "get",
    pathTemplate: "/getPurchaseDownloads",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetreferringaffiliate", {
    name: "GetGetreferringaffiliate",
    description: `Returns the referring partner for an affiliate`,
    inputSchema: {"type":"object","properties":{"affiliate_id":{"type":"string","description":"ID of the affiliate to check for referral"}},"required":["affiliate_id"]},
    method: "get",
    pathTemplate: "/getReferringAffiliate",
    executionParameters: [{"name":"affiliate_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetsmartupgrade", {
    name: "GetGetsmartupgrade",
    description: `Returns details of a smart upgrade, including HTML widget code if purchase IDs are provided.
Note: Response may be slow, caching is recommended.
`,
    inputSchema: {"type":"object","properties":{"smartupgrade_id":{"type":"string","description":"ID of the smart upgrade to retrieve"},"purchase_id":{"type":"string","description":"Single purchase ID or comma-separated list of purchase IDs"}},"required":["smartupgrade_id"]},
    method: "get",
    pathTemplate: "/getSmartupgrade",
    executionParameters: [{"name":"smartupgrade_id","in":"query"},{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetupgrade", {
    name: "GetGetupgrade",
    description: `Returns details of an upgrade and optionally checks if upgrade is possible for specific orders`,
    inputSchema: {"type":"object","properties":{"upgrade_id":{"type":"number","description":"Numeric ID of the upgrade to retrieve"},"order_ids":{"type":"string","description":"Comma-separated list of order IDs to check upgrade possibility"}},"required":["upgrade_id"]},
    method: "get",
    pathTemplate: "/getUpgrade",
    executionParameters: [{"name":"upgrade_id","in":"query"},{"name":"order_ids","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetupsells", {
    name: "GetGetupsells",
    description: `Returns the upsell product IDs for an initial product.
The upsell tree keys indicate positions in the upsell process:
- y = First upsell offer after initial sale
- yy = Upsell offer after buyer bought first upsell
- yn = Upsell offer if buyer declined first upsell
Keys consist of 1-5 characters, only y and n, always beginning with y.
`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"ID of the product to get upsells for"}},"required":["product_id"]},
    method: "get",
    pathTemplate: "/getUpsells",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetGetuserinfo", {
    name: "GetGetuserinfo",
    description: `Returns data about the current user (the owner of the API key)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/getUserInfo",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["getVoucher", {
    name: "getVoucher",
    description: `Returns details about a specific voucher code`,
    inputSchema: {"type":"object","properties":{"code":{"type":"string","description":"The voucher code that the buyer enters on the order form"}},"required":["code"]},
    method: "get",
    pathTemplate: "/getVoucher",
    executionParameters: [{"name":"code","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["ipnDelete", {
    name: "ipnDelete",
    description: `Deletes the IPN connection with the given domain_id`,
    inputSchema: {"type":"object","properties":{"domain_id":{"type":"string","description":"Used to delete the IPN connection"}},"required":["domain_id"]},
    method: "delete",
    pathTemplate: "/ipnDelete",
    executionParameters: [{"name":"domain_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["ipnInfo", {
    name: "ipnInfo",
    description: `Returns the settings of the IPN connection`,
    inputSchema: {"type":"object","properties":{"domain_id":{"type":"string","description":"Domain ID specified when creating the connection using ipnSetup"}}},
    method: "get",
    pathTemplate: "/ipnInfo",
    executionParameters: [{"name":"domain_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["ipnSetup", {
    name: "ipnSetup",
    description: `Creates an IPN connection for receiving notifications`,
    inputSchema: {"type":"object","properties":{"requestBody":{"type":"object","required":["ipn_url","name","product_ids"],"properties":{"ipn_url":{"type":"string","description":"URL where Digistore24 sends the IPN notification"},"name":{"type":"string","description":"The name listed on Digistore (e.g. your platform name)"},"product_ids":{"type":"string","description":"\"all\" or a comma-separated list of product IDs"},"domain_id":{"type":"string","description":"Used to delete the IPN connection and ensure uniqueness. Usually your platform name"},"categories":{"type":"string","description":"Comma separated list of transaction categories"},"transactions":{"type":"string","description":"Comma-separated list of transaction types","default":"payment,refund,chargeback,payment_missed"},"timing":{"type":"string","enum":["before_thankyou","delayed"],"default":"before_thankyou","description":"Controls when the IPN notification is sent"},"sha_passphrase":{"type":"string","maxLength":63,"description":"Password for signing parameters. Use \"random\" for auto-generated 30-char password"},"newsletter_send_policy":{"type":"string","enum":["end_policy_send_always","end_if_not_optout","end_if_optout","end_if_optin"],"default":"end_policy_send_always","description":"Controls when to send IPN based on newsletter opt-in status"}},"description":"The JSON request body."}},"required":["requestBody"]},
    method: "post",
    pathTemplate: "/ipnSetup",
    executionParameters: [],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listAccountAccess", {
    name: "listAccountAccess",
    description: `Returns a list of accounts granted access to or by the API key owner's account`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listAccountAccess",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listBuyers", {
    name: "listBuyers",
    description: `Returns a paginated list of your Digistore24 buyers`,
    inputSchema: {"type":"object","properties":{"page_no":{"type":"number","default":1,"minimum":1,"description":"Page number for pagination (starts at 1)"},"page_size":{"type":"number","default":100,"minimum":1,"description":"Number of buyers per page"}}},
    method: "get",
    pathTemplate: "/listBuyers",
    executionParameters: [{"name":"page_no","in":"query"},{"name":"page_size","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listBuyUrls", {
    name: "listBuyUrls",
    description: `Returns a list of buy URLs for your products`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listBuyUrls",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listCommissions", {
    name: "listCommissions",
    description: `Returns a list of your Digistore24 commission amounts`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","default":"-24h","description":"Start time for commission list (e.g. \"2014-02-28 23:11:24\", \"now\", \"-3d\", \"start\")"},"to":{"type":"string","default":"now","description":"End time for commission list"},"page_no":{"type":"number","default":1,"minimum":1,"description":"Page number for pagination (starts at 1)"},"page_size":{"type":"number","default":0,"minimum":0,"description":"Number of items per page (0 for all entries)"},"transaction_type":{"type":"string","default":"payment,refund,refund_request,chargeback","description":"Filter by transaction types"},"commission_type":{"type":"string","default":"all","description":"Filter by commission types"},"purchase_id":{"type":"string","description":"Filter by specific purchase ID"}}},
    method: "get",
    pathTemplate: "/listCommissions",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"},{"name":"page_no","in":"query"},{"name":"page_size","in":"query"},{"name":"transaction_type","in":"query"},{"name":"commission_type","in":"query"},{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listConversionTools", {
    name: "listConversionTools",
    description: `Returns a list of all the conversions that you have set up in Digistore24`,
    inputSchema: {"type":"object","properties":{"type":{"type":"string","description":"Types of conversion tools to list (comma-separated)"}},"required":["type"]},
    method: "get",
    pathTemplate: "/listConversionTools",
    executionParameters: [{"name":"type","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listCountries", {
    name: "listCountries",
    description: `Returns a list of countries that are set up in Digistore24, with their two-digit ISO country codes`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listCountries",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listCurrencies", {
    name: "listCurrencies",
    description: `Returns a list of currencies that can be used when selling via Digistore24`,
    inputSchema: {"type":"object","properties":{"convert_to":{"type":"string","description":"Optional list of currencies to get exchange rates for (e.g. \"EUR\", \"EUR,USD,CHF\", or \"all\")"}}},
    method: "get",
    pathTemplate: "/listCurrencies",
    executionParameters: [{"name":"convert_to","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listEticketLocations", {
    name: "listEticketLocations",
    description: `Lists your e-ticket locations`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listEticketLocations",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listCustomFormRecords", {
    name: "listCustomFormRecords",
    description: `Returns a list with data from additional input fields`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"Optional Digistore24 order ID to filter records"}}},
    method: "get",
    pathTemplate: "/listCustomFormRecords",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listEticketTemplates", {
    name: "listEticketTemplates",
    description: `Lists your e-ticket templates`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listEticketTemplates",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listServiceProofRequests", {
    name: "listServiceProofRequests",
    description: `Retrieve a list of service proof requests for your Digistore account`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listServiceProofRequests",
    executionParameters: [{"name":"search","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listDeliveries", {
    name: "listDeliveries",
    description: `Returns a list of your deliveries`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listDeliveries",
    executionParameters: [{"name":"search","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listEtickets", {
    name: "listEtickets",
    description: `Returns a list of e-tickets`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listEtickets",
    executionParameters: [{"name":"search","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listImages", {
    name: "listImages",
    description: `Returns a list of your Digistore24 images`,
    inputSchema: {"type":"object","properties":{"usage_type":{"type":"string","description":"Purpose of the images (e.g. 'product'). See getGlobalSettings() image_usage_type field"}},"required":["usage_type"]},
    method: "get",
    pathTemplate: "/listImages",
    executionParameters: [{"name":"usage_type","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listInvoices", {
    name: "listInvoices",
    description: `Returns a list of invoices for a specific purchase`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The ID of the purchase (must belong to the Digistore account associated with the API key)"}},"required":["purchase_id"]},
    method: "get",
    pathTemplate: "/listInvoices",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listMarketplaceEntries", {
    name: "listMarketplaceEntries",
    description: `Lists all marketplace data of the vendor including statistical numbers`,
    inputSchema: {"type":"object","properties":{"sort_by":{"type":"string","description":"Sorting criteria for marketplace entries"}}},
    method: "get",
    pathTemplate: "/listMarketplaceEntries",
    executionParameters: [{"name":"sort_by","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listOrderforms", {
    name: "listOrderforms",
    description: `Lists your order forms`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listOrderforms",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listPurchasesOfEmail", {
    name: "listPurchasesOfEmail",
    description: `Lists purchases belonging to an email address`,
    inputSchema: {"type":"object","properties":{"email":{"type":"string","format":"email","description":"The buyer's email address"},"limit":{"type":"number","default":100,"minimum":1,"description":"Maximum number of purchases to show"}},"required":["email"]},
    method: "get",
    pathTemplate: "/listPurchasesOfEmail",
    executionParameters: [{"name":"email","in":"query"},{"name":"limit","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listPaymentPlans", {
    name: "listPaymentPlans",
    description: `Returns a list of payment plans created for a product on Digistore24`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"The Digistore24 product ID"}},"required":["product_id"]},
    method: "get",
    pathTemplate: "/listPaymentPlans",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listPayouts", {
    name: "listPayouts",
    description: `Returns a list of your credit notes as a vendor and affiliate on Digistore24`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listPayouts",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listProductGroups", {
    name: "listProductGroups",
    description: `Returns a list of your product groups`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listProductGroups",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listShippingCostPolicies", {
    name: "listShippingCostPolicies",
    description: `Returns a list of your shipping cost policies`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listShippingCostPolicies",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listProducts", {
    name: "listProducts",
    description: `Returns a list of your Digistore24 products`,
    inputSchema: {"type":"object","properties":{"sort_by":{"type":"string","enum":["name","group"],"default":"name","description":"Sort products by name or product group"}}},
    method: "get",
    pathTemplate: "/listProducts",
    executionParameters: [{"name":"sort_by","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listProductTypes", {
    name: "listProductTypes",
    description: `Returns a list of available product types`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listProductTypes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["listPurchases", {
    name: "listPurchases",
    description: `Returns a list of your sales, including those where you get a commission (e.g. joint ventures)`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","default":"-24h","description":"Start time for purchase list (e.g. \"2014-02-28 23:11:24\", \"now\", \"-3d\", \"start\")"},"to":{"type":"string","default":"now","description":"End time for purchase list"},"sort_by":{"type":"string","enum":["date","earning","amount"],"default":"date","description":"Sort criteria"},"sort_order":{"type":"string","enum":["asc","desc"],"default":"asc","description":"Sort order"},"load_transactions":{"type":"boolean","default":false,"description":"Include transaction list for each purchase"},"page_no":{"type":"number","default":1,"minimum":1,"description":"Page number (starts at 1)"},"page_size":{"type":"number","default":500,"minimum":1,"description":"Number of items per page"}}},
    method: "get",
    pathTemplate: "/listPurchases",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"},{"name":"search","in":"query"},{"name":"sort_by","in":"query"},{"name":"sort_order","in":"query"},{"name":"load_transactions","in":"query"},{"name":"page_no","in":"query"},{"name":"page_size","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetListrebillingstatuschanges", {
    name: "GetListrebillingstatuschanges",
    description: `Returns a list of status changes regarding rebilling`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","description":"Start time for the query (e.g. \"2014-02-28 23:11:24\", \"now\", \"-3d\", \"start\")"},"to":{"type":"string","description":"End time for the query"},"page_no":{"type":"number","minimum":1,"description":"Page number, starting at 1"},"page_size":{"type":"number","minimum":1,"description":"Number of entries per page"}}},
    method: "get",
    pathTemplate: "/listRebillingStatusChanges",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"},{"name":"page_no","in":"query"},{"name":"page_size","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["GetListsmartupgrades", {
    name: "GetListsmartupgrades",
    description: `Returns a list of all smart upgrades that you have set up in Digistore24`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/listSmartUpgrades",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostListtransactions", {
    name: "PostListtransactions",
    description: `Returns a list of transactions where you get a commission for. This includes payments, refunds 
and chargebacks from joint venture sales.
`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","default":"-24h","description":"Point of time to filter transaction creation date from. Examples:\n- \"2014-02-28 23:11:24\"\n- \"2021-10-08T07:20:11-05:00\" (ISO 8601)\n- \"now\" for current time\n- \"-3d\" for 3 days ago\n- \"start\" for first available date\n"},"to":{"type":"string","default":"now","description":"Point of time to filter transaction creation date to"},"search":{"type":"object","properties":{"role":{"type":"string","description":"Filter by role (vendor, affiliate, other). Comma-separated for multiple."},"product_id":{"type":"string","description":"Filter by product ID(s). Comma-separated for multiple."},"first_name":{"type":"string","description":"Filter by buyer first name"},"last_name":{"type":"string","description":"Filter by buyer last name"},"email":{"type":"string","description":"Filter by buyer email"},"has_affiliate":{"type":"boolean","description":"Filter transactions with/without affiliate"},"affiliate_name":{"type":"string","description":"Filter by affiliate name"},"pay_method":{"type":"string","description":"Filter by payment method(s). Comma-separated for multiple."},"billing_type":{"type":"string","description":"Filter by billing type(s). Comma-separated for multiple."},"transaction_type":{"type":"string","description":"Filter by transaction type(s) (payment, refund, chargeback, refund_request)"},"currency":{"type":"string","description":"Filter by currency code"},"purchase_id":{"type":"string","description":"Filter by purchase ID(s). Comma-separated for multiple."}},"description":"Search criteria"},"sort_by":{"type":"string","enum":["date","earning","amount"],"default":"date","description":"Field to sort results by"},"sort_order":{"type":"string","enum":["asc","desc"],"default":"asc","description":"Sort direction"},"page_no":{"type":"number","minimum":1,"default":1,"description":"Page number (starts at 1)"},"page_size":{"type":"number","minimum":1,"maximum":1000,"default":500,"description":"Number of entries per page"}}},
    method: "post",
    pathTemplate: "/listTransactions",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"},{"name":"search","in":"query"},{"name":"sort_by","in":"query"},{"name":"sort_order","in":"query"},{"name":"page_no","in":"query"},{"name":"page_size","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostListupgrades", {
    name: "PostListupgrades",
    description: `Lists all upgrades that you have created in Digistore24`,
    inputSchema: {"type":"object","properties":{}},
    method: "post",
    pathTemplate: "/listUpgrades",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostListvouchers", {
    name: "PostListvouchers",
    description: `Returns a list of all voucher codes`,
    inputSchema: {"type":"object","properties":{}},
    method: "post",
    pathTemplate: "/listVouchers",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostGetaffiliateforemail", {
    name: "PostGetaffiliateforemail",
    description: `Returns the affiliate data previously assigned to the email by setAffiliateForEmail`,
    inputSchema: {"type":"object","properties":{"email":{"type":"string","format":"email","description":"The email address of the future buyer"}},"required":["email"]},
    method: "post",
    pathTemplate: "/getAffiliateForEmail",
    executionParameters: [{"name":"email","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["PostCreaterebillingpayment", {
    name: "PostCreaterebillingpayment",
    description: `Triggers a rebilling payment for a purchase. Only available for vendors with "Billing on demand" permission.
The payment plan must be set to "Billing mode: by trigger" in the payment plan details.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The ID of the purchase to trigger rebilling payment for"}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/createRebillingPayment",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["ping", {
    name: "ping",
    description: `Tests the connection to the Digistore24 server and determines the server time.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/ping",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["refundPartially", {
    name: "refundPartially",
    description: `Refunds a partial amount of a payment (not the complete payment). The refund amount is treated as a discount. The order status does not change.`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The purchase ID"},"amount":{"type":"number","format":"float","description":"The amount to refund. Must not be higher than a payment amount."}},"required":["purchase_id","amount"]},
    method: "post",
    pathTemplate: "/refundPartially",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"amount","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["refundPurchase", {
    name: "refundPurchase",
    description: `Refunds all payments of an order which may be refunded.`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The purchase ID"},"force":{"type":"boolean","default":false,"description":"If false (default), the refund will only be processed if the refund policy allows it. If true, the refund will be attempted anyway."},"request_date":{"type":"string","format":"date","default":"now","description":"If given, apply refund policies based on the given date. Use this if there is a delay between refund request by the buyer and processing time."}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/refundPurchase",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"force","in":"query"},{"name":"request_date","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["refundTransaction", {
    name: "refundTransaction",
    description: `Refunds a payment for the order.`,
    inputSchema: {"type":"object","properties":{"transaction_id":{"type":"string","description":"The transaction ID"},"force":{"type":"boolean","default":false,"description":"If false (default), the refund will only be processed if the refund policy allows it. If true, the refund will be attempted anyway."},"request_date":{"type":"string","format":"date","default":"now","description":"If given, apply refund policies based on the given date. Use this if there is a delay between refund request by the buyer and processing time."}},"required":["transaction_id"]},
    method: "post",
    pathTemplate: "/refundTransaction",
    executionParameters: [{"name":"transaction_id","in":"query"},{"name":"force","in":"query"},{"name":"request_date","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["renderJsTrackingCode", {
    name: "renderJsTrackingCode",
    description: `Creates a JavaScript code that reads the current affiliate, campaign key and tracking key on a landing page and stores them e.g. in hidden inputs.`,
    inputSchema: {"type":"object","properties":{"affiliate_input":{"type":"string","description":"The name of the HTML form input field to be updated with the affiliate name"},"campaignkey_input":{"type":"string","description":"The name of the HTML form input field to be updated with the campaign key"},"trackingkey_input":{"type":"string","description":"The name of the HTML form input field to be updated with the tracking key"},"callback":{"type":"string","description":"The name of a JavaScript function that is called up with the transferred data"}}},
    method: "get",
    pathTemplate: "/renderJsTrackingCode",
    executionParameters: [{"name":"affiliate_input","in":"query"},{"name":"campaignkey_input","in":"query"},{"name":"trackingkey_input","in":"query"},{"name":"callback","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["reportFraud", {
    name: "reportFraud",
    description: `Reports the customer and/or the affiliate as a fraud.`,
    inputSchema: {"type":"object","properties":{"transaction_id":{"type":"number","description":"The numeric ID of the fraud transaction"},"who":{"type":"string","enum":["buyer","affiliate","buyer","affiliate"],"description":"Specifies who is being reported as fraud"},"comment":{"type":"string","description":"Explanation of why this is considered a fraud order"}},"required":["transaction_id","who","comment"]},
    method: "post",
    pathTemplate: "/reportFraud",
    executionParameters: [{"name":"transaction_id","in":"query"},{"name":"who","in":"query"},{"name":"comment","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["requestApiKey", {
    name: "requestApiKey",
    description: `Initiates the interactive process of creating a new API key.`,
    inputSchema: {"type":"object","properties":{"permissions":{"type":"string","enum":["read-only","writable"],"description":"The rights of the new key"},"return_url":{"type":"string","description":"URL to redirect the user after API key creation"},"cancel_url":{"type":"string","description":"URL to redirect the user if they cancel the API key creation"},"site_url":{"type":"string","description":"URL to be stored with the key as a website in use"},"comment":{"type":"string","description":"Optional comment to be deposited with the new API key"}},"required":["permissions","return_url"]},
    method: "post",
    pathTemplate: "/requestApiKey",
    executionParameters: [{"name":"permissions","in":"query"},{"name":"return_url","in":"query"},{"name":"cancel_url","in":"query"},{"name":"site_url","in":"query"},{"name":"comment","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["resendInvoiceMail", {
    name: "resendInvoiceMail",
    description: `Sends an email with all invoices pertaining to the order.`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The Digistore24 order ID"}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/resendInvoiceMail",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["resendPurchaseConfirmationMail", {
    name: "resendPurchaseConfirmationMail",
    description: `Resends the order confirmation email.`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The Digistore24 order ID"}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/resendPurchaseConfirmationMail",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["retrieveApiKey", {
    name: "retrieveApiKey",
    description: `Retrieves the new API key using a token previously returned by the requestApiKey function.`,
    inputSchema: {"type":"object","properties":{"token":{"type":"string","description":"Token returned by the requestApiKey function"}},"required":["token"]},
    method: "post",
    pathTemplate: "/retrieveApiKey",
    executionParameters: [{"name":"token","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["setAffiliateForEmail", {
    name: "setAffiliateForEmail",
    description: `Assigns an affiliate, campaign key and tracking key to an email address.`,
    inputSchema: {"type":"object","properties":{"email":{"type":"string","format":"email","description":"The email address of the future buyer"},"affiliate":{"type":"string","description":"The affiliate's Digistore24 ID"},"campaignkey":{"type":"string","description":"The affiliate's campaign key"},"trackingkey":{"type":"string","description":"Your tracking key"},"click_id":{"type":"string","description":"Your affiliate's click ID (for their S2S postback connection)"}},"required":["email","affiliate"]},
    method: "post",
    pathTemplate: "/setAffiliateForEmail",
    executionParameters: [{"name":"email","in":"query"},{"name":"affiliate","in":"query"},{"name":"campaignkey","in":"query"},{"name":"trackingkey","in":"query"},{"name":"click_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["setReferringAffiliate", {
    name: "setReferringAffiliate",
    description: `Set the referring partner for an affiliate.`,
    inputSchema: {"type":"object","properties":{"referrer_id":{"type":"string","description":"The partner bringing affiliates"},"affiliate_id":{"type":"string","description":"The affiliate possibly referred by the partner"},"commission":{"type":"number","format":"float","description":"The percentage of the affiliate commission the vendor will pay to the referring partner"}},"required":["referrer_id","affiliate_id"]},
    method: "post",
    pathTemplate: "/setReferringAffiliate",
    executionParameters: [{"name":"referrer_id","in":"query"},{"name":"affiliate_id","in":"query"},{"name":"commission","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["startRebilling", {
    name: "startRebilling",
    description: `Resumes the payments if they have been stopped.`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The Digistore24 order ID"}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/startRebilling",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsAffiliateToplist", {
    name: "statsAffiliateToplist",
    description: `Returns the list of your affiliates sorted by sales for a specified time period.`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","format":"yyyy-MM","description":"Start month for the report (e.g., 2015-01)"},"to":{"type":"string","format":"yyyy-MM","description":"End month for the report (e.g., 2015-12)"},"affiliate":{"type":"string","description":"Digistore id of a specific affiliate (optional)"},"currency":{"type":"string","description":"Currency code to show the revenue for (e.g., USD, EUR, GBP, CHF, PLN)"}},"required":["from","to"]},
    method: "get",
    pathTemplate: "/statsAffiliateToplist",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"},{"name":"affiliate","in":"query"},{"name":"currency","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsDailyAmounts", {
    name: "statsDailyAmounts",
    description: `Returns a list of daily sales amounts for a specified time range.`,
    inputSchema: {"type":"object","properties":{"from":{"type":"string","description":"Start date for the report. Can be a date string, 'now', or a relative time like '-7d'."},"to":{"type":"string","description":"End date for the report. Can be a date string, 'now', or a relative time."}}},
    method: "get",
    pathTemplate: "/statsDailyAmounts",
    executionParameters: [{"name":"from","in":"query"},{"name":"to","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsExpectedPayouts", {
    name: "statsExpectedPayouts",
    description: `Returns a list of expected payouts as displayed on the Digistore24 dashboard.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/statsExpectedPayouts",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsMarketplace", {
    name: "statsMarketplace",
    description: `Returns the marketplace statistics.
`,
    inputSchema: {"type":"object","properties":{"language":{"type":"string","description":"Language code (e.g., \"de\" - for a list of languages, see getGlobalSettings)"}}},
    method: "get",
    pathTemplate: "/statsMarketplace",
    executionParameters: [{"name":"language","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsSales", {
    name: "statsSales",
    description: `Returns a list of sales statistics for a specified period.
`,
    inputSchema: {"type":"object","properties":{"period":{"type":"string","enum":["day","month","quarter","year"],"default":"week","description":"The time period for grouping sales data"},"from":{"type":"string","format":"date","description":"Start date for the statistics (e.g., 2017-12-31)"},"to":{"type":"string","format":"date","description":"End date for the statistics"}}},
    method: "get",
    pathTemplate: "/statsSales",
    executionParameters: [{"name":"period","in":"query"},{"name":"from","in":"query"},{"name":"to","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["statsSalesSummary", {
    name: "statsSalesSummary",
    description: `Returns an overview of the revenue for different time periods.
`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/statsSalesSummary",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["stopRebilling", {
    name: "stopRebilling",
    description: `Stops the recurring payments (for subscription and installment payments).
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The Digistore24 order ID"},"force":{"type":"boolean","default":false,"description":"If possible, a rebilling is canceled immediately. If a minimum duration is specified, this will be adhered to by default (for force=false),\nmeaning that it will be canceled at the end of the minimum duration. If force=true, it will be canceled immediately.\n"},"ignore_refund_possibility":{"type":"boolean","default":false,"description":"If false (default), the purchase is cancelled effective immediately if a refund is possible.\nIf true, the cancellation becomes effective at the end of the regular cancellation period.\nThe parameter is ignored if force=true.\n"}},"required":["purchase_id"]},
    method: "post",
    pathTemplate: "/stopRebilling",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"force","in":"query"},{"name":"ignore_refund_possibility","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["unregister", {
    name: "unregister",
    description: `Deletes the current API key if it was created interactively.
`,
    inputSchema: {"type":"object","properties":{}},
    method: "delete",
    pathTemplate: "/unregister",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateAffiliateCommission", {
    name: "updateAffiliateCommission",
    description: `Changes the affiliate commission(s) for one or more products.
If product_ids is not "all" and no affiliations have been set up for some products, then they will be recreated.
`,
    inputSchema: {"type":"object","properties":{"affiliate_id":{"type":"string","description":"The ID or the name of the affiliate"},"product_ids":{"type":"string","description":"Comma-separated list of product IDs for which the commission should be changed, or \"all\" for all products"},"requestBody":{"type":"object","properties":{"commission_rate":{"type":"number","format":"float","description":"Percentage of the affiliate commission"},"commission_fix":{"type":"number","format":"float","description":"Commission amount (in the specified currency)"},"commission_currency":{"type":"string","description":"Currency of the commission amount (if specified)"},"approval_status":{"type":"string","enum":["new","approved","rejected","pending"],"description":"Approval status of the affiliation"}},"description":"The JSON request body."}},"required":["affiliate_id","product_ids"]},
    method: "put",
    pathTemplate: "/updateAffiliateCommission",
    executionParameters: [{"name":"affiliate_id","in":"query"},{"name":"product_ids","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateBuyer", {
    name: "updateBuyer",
    description: `Updates the buyer's contact details.
`,
    inputSchema: {"type":"object","properties":{"buyer_id":{"type":"number","description":"The buyer ID, as returned by e.g. getPurchase"},"requestBody":{"type":"object","properties":{"email":{"type":"string","format":"email","description":"Buyer's email address"},"first_name":{"type":"string","description":"Buyer's first name"},"last_name":{"type":"string","description":"Buyer's last name"},"salutation":{"type":"string","enum":["","M","F"],"description":"Buyer's salutation (empty, M or F)"},"title":{"type":"string","description":"Buyer's title"},"company":{"type":"string","description":"Buyer's company name"},"street_name":{"type":"string","description":"Street name"},"street_number":{"type":"string","description":"Street number"},"phone_number":{"type":"string","description":"Phone number (can be overwritten with an empty string)"},"city":{"type":"string","description":"City"},"zipcode":{"type":"string","description":"ZIP/Postal code"},"state":{"type":"string","description":"State/Province"},"country":{"type":"string","description":"Two-digit ISO country code (e.g., DE or AT)"}},"description":"The JSON request body."}},"required":["buyer_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateBuyer",
    executionParameters: [{"name":"buyer_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateDelivery", {
    name: "updateDelivery",
    description: `Updates a delivery record with new status, tracking information, and other details.
`,
    inputSchema: {"type":"object","properties":{"delivery_id":{"type":"number","description":"The ID of the delivery to update"},"notify_via_email":{"type":"boolean","default":true,"description":"Whether to notify the buyer via email about the delivery update"},"requestBody":{"type":"object","properties":{"data":{"type":"object","properties":{"type":{"type":"string","enum":["request","in_progress","delivery","partial_delivery","return","cancel"],"description":"The type of delivery status"},"is_shipped":{"type":"boolean","description":"Y = The product has been shipped (type is set to 'delivery'), N = The delivery was cancelled (type is set to 'cancel')"},"quantity_delivered":{"type":"number","description":"Sets the delivery quantity to the given value"},"add_quantity_delivered":{"type":"number","description":"Adds the given value to the delivery quantity"},"is_shipped_by_reseller_from":{"type":"string","description":"If you are a fulfillment center, set this parameter to your code if is_shippment_by_reseller_id is set for a delivery"}}},"tracking":{"type":"array","description":"List of tracking information","items":{"type":"object","properties":{"parcel_service":{"type":"string","description":"The parcel service key (see https://www.digistore24.com/support/parcel_services)"},"tracking_id":{"type":"string","description":"The tracking ID for the shipment"},"expect_delivery_at":{"type":"string","format":"date","description":"Expected delivery date"},"quantity":{"type":"number","description":"Quantity of items in this tracking entry (default is all items)"},"operation":{"type":"string","enum":["create_or_update","delete"],"default":"create_or_update","description":"Operation to perform on the tracking information"}}}}},"description":"The JSON request body."}},"required":["delivery_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateDelivery",
    executionParameters: [{"name":"delivery_id","in":"query"},{"name":"notify_via_email","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateOrderform", {
    name: "updateOrderform",
    description: `Changes an existing order form on Digistore24.
`,
    inputSchema: {"type":"object","properties":{"orderform_id":{"type":"number","description":"The ID of the order form to update"},"requestBody":{"type":"object","properties":{"name":{"type":"string","description":"Name of the order form"},"product_id":{"type":"number","description":"ID of the product associated with this order form"},"paymentplan_id":{"type":"number","description":"ID of the payment plan to use"},"is_active":{"type":"boolean","description":"Whether the order form is active"},"is_default":{"type":"boolean","description":"Whether this is the default order form for the product"},"theme":{"type":"string","description":"Theme of the order form"},"language":{"type":"string","description":"Language code for the order form"},"custom_css":{"type":"string","description":"Custom CSS for the order form"},"custom_js":{"type":"string","description":"Custom JavaScript for the order form"},"custom_html":{"type":"string","description":"Custom HTML for the order form"},"custom_fields":{"type":"array","description":"Custom fields configuration","items":{"type":"object"}},"upsell_settings":{"type":"object","description":"Settings for upsells"}},"description":"The JSON request body."}},"required":["orderform_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateOrderform",
    executionParameters: [{"name":"orderform_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updatePaymentplan", {
    name: "updatePaymentplan",
    description: `Modifies a payment plan for a product on Digistore24.
`,
    inputSchema: {"type":"object","properties":{"paymentplan_id":{"type":"number","description":"The ID of the payment plan to update"},"requestBody":{"type":"object","properties":{"first_amount":{"type":"number","format":"float","description":"The amount for the first payment"},"first_billing_interval":{"type":"string","description":"The billing interval for the first payment"},"currency":{"type":"string","description":"The currency code for the payment plan (e.g., USD, EUR)"},"other_amounts":{"type":"number","format":"float","description":"The amount for subsequent payments"},"other_billing_intervals":{"type":"string","description":"The billing interval for subsequent payments"},"number_of_installments":{"type":"number","description":"The number of installments (0 for subscription, 1 for single payment, >=2 for installment plan)"},"is_active":{"type":"boolean","description":"Whether the payment plan is active"},"cancel_policy":{"type":"string","enum":["6m_0","6m_6m","6m_12m","12m_0","12m_3m","12m_6m","12m_12m","24m_0","24m_6m","24m_12m"],"description":"The cancellation policy (minimum term) for the payment plan"}},"description":"The JSON request body."}},"required":["paymentplan_id","requestBody"]},
    method: "put",
    pathTemplate: "/updatePaymentplan",
    executionParameters: [{"name":"paymentplan_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateProduct", {
    name: "updateProduct",
    description: `Modifies a user's product on Digistore24.
`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"The Digistore24 product ID"},"requestBody":{"type":"object","properties":{"name_de":{"type":"string","maxLength":63,"description":"Product name in German"},"name_en":{"type":"string","maxLength":63,"description":"Product name in English"},"name_es":{"type":"string","maxLength":63,"description":"Product name in Spanish"},"name_intern":{"type":"string","maxLength":63,"description":"Internal product name"},"description_de":{"type":"string","description":"Product description in German (filtered HTML)"},"description_en":{"type":"string","description":"Product description in English (filtered HTML)"},"description_es":{"type":"string","description":"Product description in Spanish (filtered HTML)"},"salespage_url":{"type":"string","maxLength":255,"description":"URL of the sales page"},"upsell_salespage_url":{"type":"string","maxLength":255,"description":"URL of the upsell sales page"},"thankyou_url":{"type":"string","maxLength":255,"description":"URL of the thank you page"},"image_url":{"type":"string","maxLength":255,"description":"URL of the product image"},"product_type_id":{"type":"number","description":"Product type ID (call getGlobalSettings for valid product type IDs)"},"currency":{"type":"string","description":"List of possible currencies for payments for this product (e.g., USD,EUR)"},"approval_status":{"type":"string","enum":["new","pending"],"description":"Approval status (applies to all resellers of the vendor)"},"affiliate_commision":{"type":"number","format":"float","description":"Commission for affiliates"},"buyer_type":{"type":"string","enum":["consumer","business"],"description":"consumer = prices include VAT, business = prices exclude VAT"},"is_address_input_mandatory":{"type":"boolean","description":"Y = buyer must always enter their address, N = buyer must only enter address if required for delivery"},"add_order_data_to_thankyou_page_url":{"type":"boolean","description":"Y = order data is added to URL when directing buyer to thank you page, N = no order data is added"}},"description":"The JSON request body."}},"required":["product_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateProduct",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateProductGroup", {
    name: "updateProductGroup",
    description: `Updates a product group. Product groups are folders for products that help maintain an overview of many products.
`,
    inputSchema: {"type":"object","properties":{"product_group_id":{"type":"number","description":"The ID of the product group to update"},"requestBody":{"type":"object","properties":{"name":{"type":"string","maxLength":31,"description":"Product group name. Maximum 31 characters."},"position":{"type":"number","default":10,"description":"The display order."},"is_shown_as_tab":{"type":"boolean","description":"If true, the group is displayed as a tab in the product list."}},"description":"The JSON request body."}},"required":["product_group_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateProductGroup",
    executionParameters: [{"name":"product_group_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updatePurchase", {
    name: "updatePurchase",
    description: `Changes the tracking data of an order.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The ID of the purchase to update"},"requestBody":{"type":"object","properties":{"tracking_param":{"type":"string","description":"The vendor's tracking key"},"custom":{"type":"string","description":"The custom field"},"unlock_invoices":{"type":"boolean","description":"If true, access to order details and invoices will be granted to the buyer. Invoice and order details links will then work again. By default, access expires after 3 years."},"next_payment_at":{"type":"string","format":"date-time","description":"Extend the rebilling payment interval. Use this to grant the buyer a payment pause. It's not possible to shorten the payment intervals."}},"description":"The JSON request body."}},"required":["purchase_id","requestBody"]},
    method: "put",
    pathTemplate: "/updatePurchase",
    executionParameters: [{"name":"purchase_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateServiceProofRequest", {
    name: "updateServiceProofRequest",
    description: `Provides proof that a service was delivered to a buyer when requested by Digistore24.
This is typically used when a buyer requests a refund, and Digistore24 needs verification
that the service was actually provided.
`,
    inputSchema: {"type":"object","properties":{"service_proof_id":{"type":"number","description":"The ID of the service proof request to update"},"requestBody":{"type":"object","required":["data"],"properties":{"data":{"type":"object","required":["request_status"],"properties":{"request_status":{"type":"string","enum":["proof_provided","exec_refund"],"description":"Status of the request - either providing proof or executing the refund"},"message":{"type":"string","description":"Additional message or explanation about the proof or refund decision"}}},"files":{"type":"array","description":"Array of files that serve as proof of service delivery","items":{"type":"object","required":["url"],"properties":{"url":{"type":"string","description":"Download URL for file contents"},"filename":{"type":"string","description":"Optional filename for the file"}}}}},"description":"The JSON request body."}},"required":["service_proof_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateServiceProofRequest",
    executionParameters: [{"name":"service_proof_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateShippingCostPolicy", {
    name: "updateShippingCostPolicy",
    description: `Updates an existing shipping cost policy with new settings.
`,
    inputSchema: {"type":"object","properties":{"policy_id":{"type":"number","description":"The ID of the shipping cost policy to update"},"requestBody":{"type":"object","properties":{"name":{"type":"string","maxLength":63,"description":"Name of the shipping cost policy"},"label_XX":{"type":"string","maxLength":63,"description":"Label on order form. Replace XX by the desired language code (e.g., label_en, label_de)"},"position":{"type":"number","default":100,"description":"Display position of the policy"},"is_active":{"type":"boolean","default":true,"description":"Whether the policy is active"},"for_product_ids":{"type":"string","description":"Comma-separated list of product IDs this policy applies to. Default is \"all\""},"for_countries":{"type":"string","description":"Comma-separated list of two-character ISO country codes this policy applies to (e.g., US,CA,UK). Default is \"all\""},"for_currencies":{"type":"string","description":"Comma-separated list of three-character currency codes this policy applies to (e.g., USD,EUR). Default is \"all\""},"fee_type":{"type":"string","enum":["total_fee","fee_per_unit"],"description":"Type of fee calculation"},"billing_cycle":{"type":"string","enum":["once","monthly"],"description":"When the shipping fee is charged"},"currency":{"type":"string","description":"Currency of the shipping fees (e.g., USD, EUR)"},"scale_level_count":{"type":"number","minimum":1,"maximum":5,"default":1,"description":"Number of discount levels (1-5)"},"scale_1_amount":{"type":"number","format":"float","description":"Shipping cost amount for the first level"},"scale_2_from":{"type":"number","description":"Number of items for second discount level"},"scale_2_amount":{"type":"number","format":"float","description":"Shipping cost amount for scale_2_from or more items"},"scale_3_from":{"type":"number","description":"Number of items for third discount level"},"scale_3_amount":{"type":"number","format":"float","description":"Shipping cost amount for scale_3_from or more items"},"scale_4_from":{"type":"number","description":"Number of items for fourth discount level"},"scale_4_amount":{"type":"number","format":"float","description":"Shipping cost amount for scale_4_from or more items"},"scale_5_from":{"type":"number","description":"Number of items for fifth discount level"},"scale_5_amount":{"type":"number","format":"float","description":"Shipping cost amount for scale_5_from or more items"}},"description":"The JSON request body."}},"required":["policy_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateShippingCostPolicy",
    executionParameters: [{"name":"policy_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateUpsells", {
    name: "updateUpsells",
    description: `Saves the upsells configuration for a Digistore24 product.
`,
    inputSchema: {"type":"object","properties":{"product_id":{"type":"number","description":"The numerical ID of the product"},"requestBody":{"type":"object","description":"An associative array of upsell positions and product IDs - as returned by getUpsells"}},"required":["product_id","requestBody"]},
    method: "put",
    pathTemplate: "/updateUpsells",
    executionParameters: [{"name":"product_id","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["updateVoucher", {
    name: "updateVoucher",
    description: `Updates an existing voucher code with new settings.
`,
    inputSchema: {"type":"object","properties":{"code":{"type":"string","description":"The voucher code or voucher ID to update"},"requestBody":{"type":"object","properties":{"code":{"type":"string","description":"The voucher code"},"product_ids":{"type":"string","description":"\"all\" or a comma-separated list of product IDs for which this voucher code is valid"},"valid_from":{"type":"string","format":"date-time","description":"Time from when the code is valid (e.g. 2017-12-31 12:00:00). Leave empty to remove a start time."},"expires_at":{"type":"string","format":"date-time","description":"Time when the code becomes invalid. Leave empty to remove an end time."},"first_rate":{"type":"number","description":"The discount in percent on the first payment (for subscription and installment payments) or on the purchase amount for a single payment"},"other_rates":{"type":"number","description":"The discount in percent on the follow-up payments (for subscription and installment payments)"},"first_amount":{"type":"number","description":"The discount as a fixed amount on the first payment/single payment"},"other_amounts":{"type":"number","description":"The discount as a fixed amount on the follow-up payments"},"currency":{"type":"string","description":"Currency of the discount amounts"},"is_count_limited":{"type":"boolean","description":"For FALSE (default), the code can be used without limit. For TRUE, usage is limited."},"count_left":{"type":"number","description":"If is_count_limited is TRUE, the number of times it can still be used. Default is 1."},"upgrade_policy":{"type":"string","enum":["valid","other_only","not_valid"],"description":"Determines how the code is used for upgrades"}},"description":"The JSON request body."}},"required":["code","requestBody"]},
    method: "put",
    pathTemplate: "/updateVoucher",
    executionParameters: [{"name":"code","in":"query"}],
    requestBodyContentType: "application/json",
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["validateAffiliate", {
    name: "validateAffiliate",
    description: `Checks if there is an affiliation for an affiliate and one or more products.
Returns the same information as when setting up an order form (where the affiliate name is displayed at the bottom).
`,
    inputSchema: {"type":"object","properties":{"affiliate_name":{"type":"string","description":"The Digistore24 ID of the affiliate"},"product_ids":{"type":"string","description":"One or more product IDs, separated by commas (e.g., 11,22,33,44). All product IDs must belong to the same vendor."}},"required":["affiliate_name","product_ids"]},
    method: "get",
    pathTemplate: "/validateAffiliate",
    executionParameters: [{"name":"affiliate_name","in":"query"},{"name":"product_ids","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["validateCouponCode", {
    name: "validateCouponCode",
    description: `Checks if a voucher code is valid and returns information about the voucher.
`,
    inputSchema: {"type":"object","properties":{"code":{"type":"string","description":"The voucher code or voucher ID to validate"}},"required":["code"]},
    method: "get",
    pathTemplate: "/validateCouponCode",
    executionParameters: [{"name":"code","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["validateEticket", {
    name: "validateEticket",
    description: `Validates an e-ticket against specified template, location, and date parameters.
If valid, marks the e-ticket as used.
`,
    inputSchema: {"type":"object","properties":{"eticket_id":{"type":"string","description":"The e-ticket serial number or ID to validate"},"template_id":{"type":"string","description":"The template ID or comma-separated list of template IDs"},"location_id":{"type":"string","description":"The location ID or comma-separated list of location IDs"},"date":{"type":"string","default":"now","description":"The date or comma-separated list of dates to validate against (default is current date)"},"seperator":{"type":"string","default":" ","description":"The separator character used in the response message"}},"required":["eticket_id","template_id","location_id"]},
    method: "get",
    pathTemplate: "/validateEticket",
    executionParameters: [{"name":"eticket_id","in":"query"},{"name":"template_id","in":"query"},{"name":"location_id","in":"query"},{"name":"date","in":"query"},{"name":"seperator","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
  ["validateLicenseKey", {
    name: "validateLicenseKey",
    description: `Validates a license key against a purchase and returns detailed information about the license status.
`,
    inputSchema: {"type":"object","properties":{"purchase_id":{"type":"string","description":"The purchase ID to validate the license key against"},"license_key":{"type":"string","description":"The license key to validate"}},"required":["purchase_id","license_key"]},
    method: "get",
    pathTemplate: "/validateLicenseKey",
    executionParameters: [{"name":"purchase_id","in":"query"},{"name":"license_key","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: [{"ApiKeyAuth":[]}]
  }],
]);

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes =   {
    "ApiKeyAuth": {
      "type": "apiKey",
      "in": "header",
      "name": "X-DS-API-KEY"
    }
  };


server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map(def => ({
    name: def.name,
    description: def.description,
    inputSchema: {
      type: "object",
      ...def.inputSchema
    } as Tool['inputSchema']
  }));
  return { tools: toolsForClient };
});


server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
  const { name: toolName, arguments: toolArgs } = request.params;
  const toolDefinition = toolDefinitionMap.get(toolName);
  if (!toolDefinition) {
    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: "text", text: `Error: Unknown tool requested: ${toolName}` }] };
  }
  return await executeApiTool(toolName, toolDefinition, toolArgs ?? {}, securitySchemes);
});



/**
 * Type definition for cached OAuth tokens
 */
interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
    var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}

/**
 * Acquires an OAuth2 token using client credentials flow
 * 
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
async function acquireOAuth2Token(schemeName: string, scheme: Record<string, unknown>): Promise<string | null | undefined> {
    try {
        // Check if we have the necessary credentials
        const clientId = process.env[`OAUTH_CLIENT_ID_SCHEMENAME`];
        const clientSecret = process.env[`OAUTH_CLIENT_SECRET_SCHEMENAME`];
        const scopes = process.env[`OAUTH_SCOPES_SCHEMENAME`];
        
        if (!clientId || !clientSecret) {
            console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
            return null;
        }
        
        // Initialize token cache if needed
        if (typeof global.__oauthTokenCache === 'undefined') {
            global.__oauthTokenCache = {};
        }
        
        // Check if we have a cached token
        const cacheKey = `${schemeName}_${clientId}`;
        const cachedToken = global.__oauthTokenCache[cacheKey];
        const now = Date.now();
        
        if (cachedToken && cachedToken.expiresAt > now) {
            console.error(`Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor((cachedToken.expiresAt - now) / 1000)} seconds)`);
            return cachedToken.token;
        }
        
        // Determine token URL based on flow type
        let tokenUrl = '';
        const flows = scheme.flows as Record<string, unknown> | undefined;
        const clientCredentials = flows?.clientCredentials as Record<string, unknown> | undefined;
        const password = flows?.password as Record<string, unknown> | undefined;
        
        if (clientCredentials?.tokenUrl && typeof clientCredentials.tokenUrl === 'string') {
            tokenUrl = clientCredentials.tokenUrl;
            console.error(`Using client credentials flow for '${schemeName}'`);
        } else if (password?.tokenUrl && typeof password.tokenUrl === 'string') {
            tokenUrl = password.tokenUrl;
            console.error(`Using password flow for '${schemeName}'`);
        } else {
            console.error(`No supported OAuth2 flow found for '${schemeName}'`);
            return null;
        }
        
        // Prepare the token request
        let formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        
        // Add scopes if specified
        if (scopes) {
            formData.append('scope', scopes);
        }
        
        console.error(`Requesting OAuth2 token from ${tokenUrl}`);
        
        // Make the token request
        const response = await axios({
            method: 'POST',
            url: tokenUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: formData.toString()
        });
        
        // Process the response
        if (response.data?.access_token) {
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600; // Default to 1 hour
            
            // Cache the token
            global.__oauthTokenCache[cacheKey] = {
                token,
                expiresAt: now + (expiresIn * 1000) - 60000 // Expire 1 minute early
            };
            
            console.error(`Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`);
            return token;
        } else {
            console.error(`Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`);
            return null;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
        return null;
    }
}


/**
 * Executes an API tool with the provided arguments
 * 
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
    toolName: string,
    definition: McpToolDefinition,
    toolArgs: JsonObject,
    allSecuritySchemes: Record<string, Record<string, unknown>>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
        const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
        const argsToParse = (typeof toolArgs === 'object' && toolArgs !== null) ? toolArgs : {};
        validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors.map(e => `${e.path.join('.')} (${e.code}): ${e.message}`).join(', ')}`;
            return { content: [{ type: 'text', text: validationErrorMessage }] };
        } else {
             const errorMessage = error instanceof Error ? error.message : String(error);
             return { content: [{ type: 'text', text: `Internal error during validation setup: ${errorMessage}` }] };
        }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, unknown> = {};
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    let requestBodyData: unknown = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
        const value = validatedArgs[param.name];
        if (typeof value !== 'undefined' && value !== null) {
            if (param.in === 'path') {
                urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
            }
            else if (param.in === 'query') {
                // Handle nested objects for query parameters (like data object)
                if (typeof value === 'object') {
                    Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
                        if (nestedValue !== undefined && nestedValue !== null) {
                            queryParams[`${param.name}[${nestedKey}]`] = nestedValue;
                        }
                    });
                } else {
                    queryParams[param.name] = value;
                }
            }
            else if (param.in === 'header') {
                headers[param.name.toLowerCase()] = String(value);
            }
        }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
        throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }
    
    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;
    
    // Debug: log the fully constructed URL path for verification
    console.error(`[URL] ${definition.method.toUpperCase()} ${requestUrl}`);
  console.log(requestUrl);
    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
        // For Digistore24 API, flatten the requestBody object to send parameters directly
        requestBodyData = validatedArgs['requestBody'];
        headers['content-type'] = definition.requestBodyContentType;
    }


    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find(req => {
        // Try each security requirement (combined with OR)
        return Object.entries(req).every(([schemeName, scopesArray]) => {
            const scheme = allSecuritySchemes[schemeName];
            if (!scheme) return false;
            
            // API Key security (header, query, cookie)
            if (scheme.type === 'apiKey') {
                return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            // HTTP security (basic, bearer)
            if (scheme.type === 'http') {
                if (typeof scheme.scheme === 'string' && scheme.scheme.toLowerCase() === 'bearer') {
                    return !!process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
                else if (typeof scheme.scheme === 'string' && scheme.scheme.toLowerCase() === 'basic') {
                    return !!process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] && 
                           !!process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
            }
            
            // OAuth2 security
            if (scheme.type === 'oauth2') {
                // Check for pre-existing token
                if (process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    return true;
                }
                
                // Check for client credentials for auto-acquisition
                if (process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] &&
                    process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    // Verify we have a supported flow
                    const flows = scheme.flows as Record<string, unknown> | undefined;
                    if (flows?.clientCredentials || flows?.password) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // OpenID Connect
            if (scheme.type === 'openIdConnect') {
                return !!process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            return false;
        });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
        // Apply each security scheme from this requirement (combined with AND)
        for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
            const scheme = allSecuritySchemes[schemeName];
            // Avoid logging secrets; only log scheme name
            console.error(`Applying security scheme '${schemeName}'`);
            // API Key security
            if (scheme?.type === 'apiKey') {
                const ctx = getRequestContext();
                const apiKeyFromRequest = ctx?.apiKey || null;
                const envApiKey = process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                const apiKey = apiKeyFromRequest || envApiKey;
                if (apiKey) {
                    if (scheme.in === 'header' && typeof scheme.name === 'string') {
                        // Preserve original header case for DS24
                        headers[scheme.name] = apiKey;
                        console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
                    }
                    else if (scheme.in === 'query' && typeof scheme.name === 'string') {
                        queryParams[scheme.name] = apiKey;
                        console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
                    }
                    else if (scheme.in === 'cookie' && typeof scheme.name === 'string') {
                        headers['cookie'] = `${scheme.name}=${apiKey}${headers['cookie'] ? `; ${headers['cookie']}` : ''}`;
                        console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
                    }
                }
            } 
            // HTTP security (Bearer or Basic)
            else if (scheme?.type === 'http') {
                if (typeof scheme.scheme === 'string' && scheme.scheme.toLowerCase() === 'bearer') {
                    const token = process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (token) {
                        headers['authorization'] = `Bearer ${token}`;
                        console.error(`Applied Bearer token for '${schemeName}'`);
                    }
                } 
                else if (typeof scheme.scheme === 'string' && scheme.scheme.toLowerCase() === 'basic') {
                    const username = process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    const password = process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (username && password) {
                        headers['authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                        console.error(`Applied Basic authentication for '${schemeName}'`);
                    }
                }
            }
            // OAuth2 security
            else if (scheme?.type === 'oauth2') {
                // First try to use a pre-provided token
                let token = process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                
                // If no token but we have client credentials, try to acquire a token
                const flows = scheme.flows as Record<string, unknown> | undefined;
                if (!token && (flows?.clientCredentials || flows?.password)) {
                    console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
                    token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
                }
                
                // Apply token if available
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OAuth2 token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
            // OpenID Connect
            else if (scheme?.type === 'openIdConnect') {
                const token = process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OpenID Connect token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
        }
    } 
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
        // First generate a more readable representation of the security requirements
        const securityRequirementsString = definition.securityRequirements
            .map(req => {
                const parts = Object.entries(req)
                    .map(([name, scopesArray]) => {
                        const scopes = scopesArray as string[];
                        if (scopes.length === 0) return name;
                        return `${name} (scopes: ${scopes.join(', ')})`;
                    })
                    .join(' AND ');
                return `[${parts}]`;
            })
            .join(' OR ');
            
        console.warn(`Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`);
    }
    

    // Prepare the axios request configuration
    // Digistore24 API expects method name in URL path and parameters in body
    const methodName = definition.pathTemplate.replace('/', ''); // Remove leading slash to get method name
    const apiUrl = `${API_BASE_URL}/${methodName}`;
    
    // Prepare request data
    let requestData: unknown;
    let requestContentType: string;
    
    // All Digistore24 API calls are POST with form encoding, regardless of method definition
    const formData = new URLSearchParams();
    
    // Add query parameters first
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Add request body data
    if (requestBodyData && typeof requestBodyData === 'object') {
      Object.entries(requestBodyData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !queryParams.hasOwnProperty(key)) {
          // Only add if it wasn't already added as a query parameter
          if (typeof value === 'object') {
            // Handle nested objects
            Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
              if (nestedValue !== undefined && nestedValue !== null) {
                formData.append(`${key}[${nestedKey}]`, String(nestedValue));
              }
            });
          } else {
            // Check if this method needs data[] wrapper based on method name
            // Methods like createVoucher need the data[] wrapper despite having JSON content type
            const methodsNeedingDataWrapper = [
              'createVoucher', 'createProduct', 'createBuyUrl', 'createAffiliate'
            ];
            const methodName = definition.pathTemplate.replace('/', '');
            const needsDataWrapper = methodsNeedingDataWrapper.includes(methodName);
            
            if (needsDataWrapper) {
              formData.append(`data[${key}]`, String(value));
            } else {
              // Add directly without data[] prefix for methods like createUpgrade, getProduct
              formData.append(key, String(value));
            }
          }
        }
      });
    }
    
    requestData = formData.toString();
    requestContentType = 'application/x-www-form-urlencoded';
    
    // Set content type header
    headers['content-type'] = requestContentType;
    
    const config: AxiosRequestConfig = {
      method: 'POST', 
      url: apiUrl, 
      headers: headers,
      data: requestData,
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);
    // Redact sensitive headers
    const redactHeader = (name: string, value: unknown) => {
      const lower = name.toLowerCase();
      if (['authorization','x-ds-api-key','cookie'].includes(lower)) return '[REDACTED]';
      return value;
    };
    const redactedHeaders = Object.fromEntries(Object.entries(config.headers || {}).map(([k, v]) => [k, redactHeader(k, v)]));
    console.error(`Headers: ${JSON.stringify(redactedHeaders, null, 2)}`);
    
    // Execute the request
    const response = await axios({ ...config, timeout: 15000 });

    // Process and format the response
    let responseText = '';
    const contentType = response.headers['content-type']?.toLowerCase() || '';
    
    // Handle JSON responses
    if (contentType.includes('application/json') && typeof response.data === 'object' && response.data !== null) {
         try { 
             responseText = JSON.stringify(response.data, null, 2); 
         } catch (e) { 
             responseText = "[Stringify Error]"; 
         }
    } 
    // Handle string responses
    else if (typeof response.data === 'string') { 
         responseText = response.data; 
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) { 
         try {
             responseText = JSON.stringify(response.data, null, 2); 
         } catch (e) {
             responseText = String(response.data);
         }
    }
    // Handle empty responses
    else { 
         responseText = `(Status: ${response.status} - No body content)`; 
    }
    
    // Return formatted response
    return { 
        content: [ 
            { 
                type: "text", 
                text: `API Response (Status: ${response.status}):\n${responseText}` 
            } 
        ], 
    };

  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;
    
    // Format Axios errors specially
    if (axios.isAxiosError(error)) { 
        errorMessage = formatApiError(error); 
    }
    // Handle standard errors
    else if (error instanceof Error) { 
        errorMessage = error.message; 
    }
    // Handle unexpected error types
    else { 
        errorMessage = 'Unexpected error: ' + String(error); 
    }
    
    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);
    
    // Return error message to client
    return { content: [{ type: "text", text: errorMessage }] };
  }
}


/**
 * Main function to start the server
 */
let httpServerContext: { app: unknown, mcpHandler: unknown } | null = null;

async function main() {
  // Check if we should use HTTP transport
  const useHttp = process.argv.includes('--transport=streamable-http') || process.argv.includes('--http');
  
  if (useHttp) {
    // Set up StreamableHTTP transport
    try {
      const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
      httpServerContext = await setupStreamableHttpServer(server, port) as { app: unknown, mcpHandler: unknown };
    } catch (error) {
      console.error("Error setting up StreamableHTTP server:", error);
      process.exit(1);
    }
  } else {
    // Set up stdio transport (default for MCP)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server running on stdio");
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
    console.error("Shutting down MCP server...");
    try {
        // Attempt to cleanup HTTP session resources if running in HTTP mode
        const handler = (httpServerContext as any)?.mcpHandler;
        if (handler && typeof handler.cleanup === 'function') {
            handler.cleanup();
        }
    } catch (e) {
        console.error('Error during cleanup:', e);
    } finally {
        process.exit(0);
    }
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch((error) => {
  console.error("Fatal error in main execution:", error);
  process.exit(1);
});

/**
 * Formats API errors for better readability
 * 
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
    let message = 'API request failed.';
    if (error.response) {
        message = `API Error: Status ${error.response.status} (${error.response.statusText || 'Status text not available'}). `;
        const responseData = error.response.data;
        const MAX_LEN = 200;
        if (typeof responseData === 'string') { 
            message += `Response: ${responseData.substring(0, MAX_LEN)}${responseData.length > MAX_LEN ? '...' : ''}`; 
        }
        else if (responseData) { 
            try { 
                const jsonString = JSON.stringify(responseData); 
                message += `Response: ${jsonString.substring(0, MAX_LEN)}${jsonString.length > MAX_LEN ? '...' : ''}`; 
            } catch { 
                message += 'Response: [Could not serialize data]'; 
            } 
        }
        else { 
            message += 'No response body received.'; 
        }
    } else if (error.request) {
        message = 'API Network Error: No response received from server.';
        if (error.code) message += ` (Code: ${error.code})`;
    } else { 
        message += `API Request Setup Error: ${error.message}`; 
    }
    return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 * 
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: JsonSchema, toolName: string): z.ZodTypeAny {
    if (typeof jsonSchema !== 'object' || jsonSchema === null) { 
        return z.object({}).passthrough(); 
    }
    try {
        const zodSchemaString = jsonSchemaToZod(jsonSchema);
        const zodSchema = eval(zodSchemaString);
        if (typeof zodSchema?.parse !== 'function') { 
            throw new Error('Eval did not produce a valid Zod schema.'); 
        }
        return zodSchema as z.ZodTypeAny;
    } catch (err: unknown) {
        console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
        return z.object({}).passthrough();
    }
}
