using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace WolfgramAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HeartAttackRiskController : ControllerBase
    {
        private static readonly HttpClient client = new HttpClient();

        HeartAttackRiskController(IConfiguration )

        // GET api/values
        [HttpGet]
        public async Task<ActionResult<string>> Get(string ldl, string hdl, string sys, string dia, string gender="female", int age=40)
        {
            //https://localhost:44365/api/heartattackrisk?ldl=88.47%20mg/dL&hdl=68.79%20mg/dL&sys=175.71%20mm[Hg]&dia=116.53%20mm[Hg]&gender=female&age=40
            sys = sys.Replace("[", string.Empty).Replace("]", string.Empty);
            dia = dia.Replace("[", string.Empty).Replace("]", string.Empty);

            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            var url = $"http://api.wolframalpha.com/v2/query?input=Risk of Heart Attack LDL cholesterol: {ldl} HDL cholesterol: {hdl} " +
                                    $"systolic blood pressure: {sys} diastolic blood pressure: {dia} gender: {gender} age: {age}" +
                                    "&appid=W3583L-KYHWAY3A3Q&output=JSON&format=image,plaintext&podtimeout=10";

            var resultData = await client.GetStringAsync(url);
            return resultData;
        }
    }
}