using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MoviesAPI.DTOs;
using MoviesAPI.Helpers;

namespace MoviesAPI.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public AccountController(UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager,
        IConfiguration configuration, ApplicationDbContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
            _configuration = configuration;
            _signInManager = signInManager;
            _userManager = userManager;
        }

    [HttpGet("listUsers")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isAdmin")]
    public async Task<ActionResult<List<UserDto>>> GetListUsers([FromQuery] PaginationDto paginationDto)
    {
        var queryable = _context.Users.AsQueryable();
        await HttpContext.InsertParametersPaginationInHeader(queryable);
        var users = await queryable.OrderBy(x => x.Email).Paginate(paginationDto).ToListAsync();
        return _mapper.Map<List<UserDto>>(users);
    }

    [HttpPost("makeAdmin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isAdmin")]
    public async Task<ActionResult> MakeAdmin([FromBody] string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        await _userManager.AddClaimAsync(user, new Claim("role", "admin"));
        return NoContent();
    }

    [HttpPost("removeAdmin")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme, Policy = "isAdmin")]
    public async Task<ActionResult> RemoveAdmin([FromBody] string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        await _userManager.RemoveClaimAsync(user, new Claim("role", "admin"));
        return NoContent();
    }

    [HttpPost("create")]
    public async Task<ActionResult<AuthenticationResponse>> Create([FromBody] UserCredentials userCredentials)
    {
        var user = new IdentityUser { UserName = userCredentials.Email, Email = userCredentials.Email };
        var result = await _userManager.CreateAsync(user, userCredentials.Password);

        if (result.Succeeded)
        {
            return await BuildToken(userCredentials);
        }
        else
        {
            return BadRequest(result.Errors);
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthenticationResponse>> Login([FromBody] UserCredentials userCredentials)
    {
        var result = await _signInManager.PasswordSignInAsync(userCredentials.Email, userCredentials.Password, isPersistent: false, lockoutOnFailure: false);

        if (result.Succeeded)
        {
            return await BuildToken(userCredentials);
        }
        else
        {
            return BadRequest("Incorrect Login");
        }
    }

    private async Task<AuthenticationResponse> BuildToken(UserCredentials userCredentials)
    {
        var claims = new List<Claim>()
            {
                new Claim("email", userCredentials.Email)
            };

        var user = await _userManager.FindByEmailAsync(userCredentials.Email);
        var claimsDB = await _userManager.GetClaimsAsync(user);

        claims.AddRange(claimsDB);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["keyjwt"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiration = DateTime.UtcNow.AddYears(1);

        var token = new JwtSecurityToken(issuer: null, audience: null, claims: claims, expires: expiration, signingCredentials: creds);

        return new AuthenticationResponse()
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Expiration = expiration
        };
    }
}
}